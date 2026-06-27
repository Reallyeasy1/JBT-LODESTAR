/**
 * Briefing service.
 *
 * Generates a structured, Zod-validated contact briefing. Follows the
 * deterministic pipeline: load context -> build prompt -> LLM (mock by default)
 * -> Zod validate -> verify -> save Briefing + AgentRun. Never lets AI output
 * reach the database unvalidated.
 *
 * See `okf/workflows/briefing-generation.md`.
 */

import { db } from "@/lib/db";
import { getLLMClient } from "@/ai/client";
import {
  buildBriefingMessages,
  BRIEFING_PROMPT_VERSION,
  type BriefingPromptContext,
} from "@/ai/prompts/briefing";
import {
  BriefingOutputSchema,
  type BriefingOutput,
} from "@/ai/schemas/briefing.schema";
import { verifyBriefing } from "@/services/verification.service";
import { startAgentRun, completeAgentRun } from "@/services/agent-run.service";

export type GenerateBriefingParams = {
  contactId: string;
  userId: string;
};

export type GenerateBriefingResult = {
  briefingId: string;
  agentRunId: string;
  briefing: BriefingOutput;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

/**
 * Deterministic mock briefing factory. Builds plausible, contact-specific output
 * so the demo works with no API key. The shape MUST satisfy BriefingOutputSchema.
 */
function buildMockBriefing(ctx: BriefingPromptContext): unknown {
  const c = ctx.contact;
  const name = c.fullName?.trim() || "This contact";
  const title = c.title?.trim();
  const company = c.company?.trim() || "their organisation";
  const goal = ctx.goal?.trim() || "your networking goal";
  const eventName = ctx.eventName?.trim() || "this event";
  const tags = c.tags ?? [];
  const languages = c.languages ?? [];
  const notes = (c.notes ?? "")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const personSummary =
    `${name}${title ? `, ${title} at ${company},` : ` works at ${company} and`} ` +
    (notes[0] ? notes[0] : `is an active contact from ${eventName}.`);

  const whyTheyMatter =
    `For ${goal}, ${name} is a strong fit: their role${
      title ? ` as ${title}` : ""
    } at ${company} lines up directly with what you want out of ${eventName}.`;

  // Talking points: pull specifics from notes first, then grounded fallbacks.
  const talkingPoints: string[] = [];
  if (notes[0]) talkingPoints.push(`Reference their work: "${notes[0]}"`);
  if (notes[1]) talkingPoints.push(`Pick up the thread: "${notes[1]}"`);
  const fallbacks = [
    `Connect ${company}'s priorities to your goal of ${goal}.`,
    `Ask what brought ${name} to ${eventName} this year.`,
    `Share a concrete, relevant result you have shipped recently.`,
  ];
  for (const f of fallbacks) {
    if (talkingPoints.length >= 3) break;
    talkingPoints.push(f);
  }

  // Exactly 2 questions, tuned to opportunity type.
  let questionsToAsk: string[];
  if (tags.includes("investor")) {
    questionsToAsk = [
      "What does your current thesis look like for early-stage AI infrastructure?",
      "What signals do you look for in a founding team before a first cheque?",
    ];
  } else if (tags.includes("pilot-customer") || tags.includes("enterprise")) {
    questionsToAsk = [
      "What would a successful pilot look like for your team in the next two quarters?",
      "Who else would need to be involved to green-light a pilot?",
    ];
  } else {
    questionsToAsk = [
      `What are you hoping to get out of ${eventName}?`,
      "What would make a follow-up conversation worth your time?",
    ];
  }

  // Cultural notes: ONLY from stated languages, always cautious, never inferred.
  const culturalNotes: string[] = [];
  for (const lang of languages) {
    if (!lang || lang.toLowerCase() === "english") continue;
    const userSpeaks = (ctx.userLanguages ?? [])
      .map((l) => l.toLowerCase())
      .includes(lang.toLowerCase());
    culturalNotes.push(
      userSpeaks
        ? `Their profile lists ${lang}. Since you also speak ${lang}, you could open with a short ${lang} greeting, then continue in English unless they switch.`
        : `Their profile lists ${lang} as a language. A brief ${lang} greeting is optional — this is based on a stated language, not an assumption about their background.`
    );
  }

  // Decision authority — from title/tags only, never demographics.
  const t = (title ?? "").toLowerCase();
  let decisionAuthority = "unknown";
  if (tags.includes("recruiter") || /recruit/.test(t)) {
    decisionAuthority = "gatekeeper";
  } else if (
    tags.includes("investor") ||
    /\b(partner|founder|managing director|principal|ceo|cfo|coo|chief)\b/.test(t)
  ) {
    decisionAuthority = "budget_holder";
  } else if (/\b(vp|vice president|head|director|lead)\b/.test(t)) {
    decisionAuthority = "influencer";
  } else if (/\b(engineer|developer|designer|analyst|associate)\b/.test(t)) {
    decisionAuthority = "end_user";
  }

  // Confidence from data completeness + source confidence only.
  let confidenceScore = 50;
  if ((c.notes ?? "").length > 40) confidenceScore += 15;
  if (title) confidenceScore += 8;
  if (c.company) confidenceScore += 7;
  if (typeof c.sourceConfidence === "number") {
    confidenceScore += Math.round(c.sourceConfidence * 15);
    if (c.sourceConfidence < 0.6) confidenceScore -= 15;
  }
  confidenceScore = Math.max(0, Math.min(100, confidenceScore));

  const likelyGoal = tags.includes("investor")
    ? "Sourcing early-stage deals and tracking promising AI founders."
    : tags.includes("pilot-customer") || tags.includes("enterprise")
    ? "Finding tools and partners to run a concrete pilot."
    : undefined;

  return {
    personSummary,
    whyTheyMatter,
    ...(likelyGoal ? { likelyGoal } : {}),
    decisionAuthority,
    talkingPoints: talkingPoints.slice(0, 3),
    questionsToAsk,
    culturalNotes,
    warnings: [] as string[],
    confidenceScore,
  };
}

/**
 * Generate, verify, and persist a briefing for a contact owned by the user.
 *
 * @throws if the contact is not found / not owned, or if the AI output fails
 *         Zod validation.
 */
export async function generateBriefing(
  params: GenerateBriefingParams
): Promise<GenerateBriefingResult> {
  const { contactId, userId } = params;

  // 1. Load context (ownership enforced via userId).
  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
    include: { event: true },
  });
  if (!contact) {
    throw new Error("Contact not found or not owned by user");
  }

  const profile = await db.userProfile.findUnique({ where: { userId } });

  const promptContext: BriefingPromptContext = {
    contact: {
      fullName: contact.fullName,
      title: contact.title,
      company: contact.company,
      languages: asStringArray(contact.languages),
      tags: asStringArray(contact.tags),
      notes: contact.notes,
      sourceConfidence: contact.sourceConfidence,
    },
    goal: contact.event?.eventGoal ?? null,
    eventName: contact.event?.name ?? null,
    userLanguages: asStringArray(profile?.languages),
    preferredTone: profile?.preferredTone ?? null,
  };

  // 2. Start AgentRun.
  const agentRunId = await startAgentRun({
    userId,
    taskType: "briefing",
    agentType: "ai-workflow-engineer",
    modelName: getLLMClient().modelName,
    promptVersion: BRIEFING_PROMPT_VERSION,
    inputJson: { contactId, promptContext },
  });

  const startedAt = Date.now();
  try {
    // 3. Build prompt + 4. Call LLM (mock supplies canned output via context).
    const client = getLLMClient();
    const messages = buildBriefingMessages(promptContext);
    const completion = await client.complete({
      task: "briefing",
      messages,
      context: { mockResponse: buildMockBriefing(promptContext) },
    });

    // 5. Zod validate (throws on invalid output).
    const parsed: unknown = JSON.parse(completion.text);
    const validated = BriefingOutputSchema.parse(parsed);

    // 6. Verify (anti-stereotyping; may lower confidence + add warnings).
    const { briefing } = verifyBriefing(validated);

    const latencyMs = Date.now() - startedAt;

    // 7. Save Briefing record.
    const saved = await db.briefing.create({
      data: {
        userId,
        contactId,
        agentRunId,
        personSummary: briefing.personSummary,
        whyTheyMatter: briefing.whyTheyMatter,
        likelyGoal: briefing.likelyGoal ?? null,
        decisionAuthority: briefing.decisionAuthority,
        talkingPoints: briefing.talkingPoints,
        questionsToAsk: briefing.questionsToAsk,
        culturalNotes: briefing.culturalNotes,
        warnings: briefing.warnings,
        confidenceScore: briefing.confidenceScore,
      },
      select: { id: true },
    });

    // 8. Complete AgentRun.
    await completeAgentRun(agentRunId, {
      outputJson: briefing,
      status: "success",
      latencyMs,
      tokenInput: completion.tokenInput,
      tokenOutput: completion.tokenOutput,
    });

    return { briefingId: saved.id, agentRunId, briefing };
  } catch (err) {
    await completeAgentRun(agentRunId, {
      outputJson: null,
      status: "error",
      latencyMs: Date.now() - startedAt,
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
