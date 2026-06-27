import fs from "fs";
import path from "path";
import type { LLMMessage } from "@/ai/client";

export const BRIEFING_PROMPT_VERSION = "briefing-v1";

/** Structured context assembled by the service and handed to the prompt + mock. */
export type BriefingPromptContext = {
  contact: {
    fullName?: string | null;
    title?: string | null;
    company?: string | null;
    languages?: string[];
    tags?: string[];
    notes?: string | null;
    sourceConfidence?: number | null;
  };
  goal?: string | null;
  eventName?: string | null;
  /** Languages the user states they speak — used only for grounded cultural notes. */
  userLanguages?: string[];
  preferredTone?: string | null;
};

/** Load an OKF knowledge file. Returns "" if unavailable so the mock never breaks. */
function readOkfFile(relativePath: string): string {
  try {
    return fs.readFileSync(
      path.join(process.cwd(), "okf", relativePath),
      "utf8"
    );
  } catch {
    return "";
  }
}

/**
 * Build the system + user messages for a briefing generation call.
 *
 * The system prompt grounds the model in the cultural-awareness and
 * anti-stereotyping OKF policy. The user prompt summarises the contact and
 * explicitly separates confirmed fields from the user's goal context.
 */
export function buildBriefingMessages(ctx: BriefingPromptContext): LLMMessage[] {
  const culturalAwareness = readOkfFile("concepts/cultural-awareness.md");
  const antiStereotyping = readOkfFile("safety/anti-stereotyping.md");

  const system = [
    "You are Lodestar's contact briefing assistant. Produce a short, factual,",
    "event-contextual briefing that helps the user prepare for a conversation.",
    "Return ONLY JSON matching BriefingOutputSchema. Be specific and grounded in",
    "the provided contact data. Do not invent facts. Mark anything uncertain.",
    "",
    "POLICY — cultural awareness:",
    culturalAwareness || "(cultural-awareness OKF unavailable)",
    "",
    "POLICY — anti-stereotyping:",
    antiStereotyping || "(anti-stereotyping OKF unavailable)",
    "",
    "Never make a personality or communication-style claim based on nationality,",
    "ethnicity, religion, or any demographic group. Cultural notes are allowed",
    "ONLY when grounded in an explicitly stated language preference.",
  ].join("\n");

  const c = ctx.contact;
  const user = [
    `User goal: ${ctx.goal?.trim() || "(not specified)"}`,
    `Event: ${ctx.eventName?.trim() || "(not specified)"}`,
    ctx.preferredTone ? `Preferred tone: ${ctx.preferredTone}` : "",
    "",
    "Contact (confirmed fields only):",
    `- Name: ${c.fullName ?? "(unknown)"}`,
    `- Title: ${c.title ?? "(unknown)"}`,
    `- Company: ${c.company ?? "(unknown)"}`,
    `- Stated languages: ${(c.languages ?? []).join(", ") || "(none stated)"}`,
    `- Tags: ${(c.tags ?? []).join(", ") || "(none)"}`,
    `- Source confidence: ${
      typeof c.sourceConfidence === "number" ? c.sourceConfidence : "(unknown)"
    }`,
    `- Notes: ${c.notes?.trim() || "(none)"}`,
    "",
    "Produce: personSummary, whyTheyMatter, optional likelyGoal,",
    "decisionAuthority (budget_holder|influencer|gatekeeper|end_user|unknown),",
    "exactly 3 talkingPoints, exactly 2 questionsToAsk, culturalNotes (stated",
    "languages only), warnings, confidenceScore (0-100).",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
