import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLLMClient } from "@/ai/client";
import {
  FollowUpOutputSchema,
  type FollowUpOutput,
} from "@/ai/schemas/followup.schema";
import {
  buildFollowUpPrompt,
  FOLLOWUP_PROMPT_VERSION,
} from "@/ai/prompts/followup";
import { startAgentRun, completeAgentRun } from "@/services/agent-run.service";

export type GenerateFollowUpResult = {
  followUpId: string;
  agentRunId: string;
  draft: FollowUpOutput;
};

type ContactForFollowUp = {
  fullName: string | null;
  title: string | null;
  company: string | null;
};

/**
 * Produces the mock draft payload. Deterministic, no network, no API key.
 * Tailored to feel realistic for an investor/VC follow-up after the
 * Sup Build2026 Hackathon (the demo scenario). Returns an object the mock
 * LLM client echoes back as JSON text, which the service then Zod-validates.
 */
function buildMockDraft(
  contact: ContactForFollowUp,
  senderName: string,
  meetingNote: string
): FollowUpOutput {
  const firstName = (contact.fullName ?? "there").split(" ")[0] || "there";
  const noteSnippet = meetingNote.trim().slice(0, 160);

  const subject = `Great to connect at Sup Build2026, ${firstName}`;

  const body = [
    `Hi ${firstName},`,
    "",
    `It was a real pleasure meeting you at the Sup Build2026 Hackathon in Singapore. ` +
      `Thank you for taking the time to dig into what we're building at Lodestar — your ` +
      `perspective on where AI networking tools are heading was genuinely useful, and it ` +
      `gave me a few things to think about as we shape the roadmap.`,
    "",
    `Following up on our conversation${
      noteSnippet ? ` (you mentioned: "${noteSnippet}")` : ""
    }, I'd love to keep the dialogue going. If you're open to it, I can send over a short ` +
      `deck and our early traction numbers so you can get a clearer picture ahead of any ` +
      `next step. Happy to work around your schedule for a longer chat in the coming weeks.`,
    "",
    `Thanks again for the time and the encouragement — it meant a lot.`,
    "",
    `Warm regards,`,
    senderName,
  ].join("\n");

  return {
    subject,
    body,
    suggestedTone: "professional",
    // Enforced as a literal in the schema — a follow-up is always a draft.
    requiresUserReview: true,
  };
}

/**
 * Generates a follow-up draft for a contact from a meeting note.
 *
 * Pipeline: load contact -> start AgentRun -> mock LLM -> Zod validate ->
 * save FollowUp draft -> complete AgentRun. Never sends anything externally.
 */
export async function generateFollowUp(
  contactId: string,
  meetingNote: string
): Promise<GenerateFollowUpResult> {
  const user = await getCurrentUser();

  const contact = await db.contact.findFirst({
    where: { id: contactId, userId: user.id },
    select: { id: true, fullName: true, title: true, company: true },
  });

  if (!contact) {
    throw new Error(`Contact not found: ${contactId}`);
  }

  const messages = buildFollowUpPrompt({
    contactName: contact.fullName ?? "the contact",
    contactTitle: contact.title,
    contactCompany: contact.company,
    meetingNote,
    senderName: user.name,
  });

  const inputJson = {
    contactId,
    meetingNote,
    messages,
  };

  const agentRunId = await startAgentRun({
    userId: user.id,
    taskType: "followup_draft",
    agentType: "ai-workflow-engineer",
    modelName: "mock",
    promptVersion: FOLLOWUP_PROMPT_VERSION,
    inputJson,
  });

  const startedAt = Date.now();

  try {
    const mockDraft = buildMockDraft(contact, user.name, meetingNote);

    const llm = getLLMClient();
    const completion = await llm.complete({
      task: "followup_draft",
      messages,
      context: { mockResponse: mockDraft },
    });

    // Parse the model output and validate. requiresUserReview MUST be true.
    const parsed: unknown = JSON.parse(completion.text);
    const draft = FollowUpOutputSchema.parse(parsed);

    const followUp = await db.followUp.create({
      data: {
        userId: user.id,
        contactId: contact.id,
        subject: draft.subject,
        draftText: draft.body,
        status: "drafted",
        userApproved: false,
      },
      select: { id: true },
    });

    const latencyMs = Date.now() - startedAt;

    await completeAgentRun(agentRunId, {
      outputJson: draft,
      status: "success",
      latencyMs,
      tokenInput: completion.tokenInput,
      tokenOutput: completion.tokenOutput,
    });

    return {
      followUpId: followUp.id,
      agentRunId,
      draft,
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);

    await completeAgentRun(agentRunId, {
      outputJson: { error: message },
      status: "error",
      latencyMs,
      errorMessage: message,
    });

    throw error;
  }
}
