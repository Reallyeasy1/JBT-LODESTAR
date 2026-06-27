import type { LLMMessage } from "@/ai/client";

export const FOLLOWUP_PROMPT_VERSION = "followup-v1";

export type FollowUpPromptInput = {
  contactName: string;
  contactTitle?: string | null;
  contactCompany?: string | null;
  meetingNote: string;
  senderName: string;
  preferredTone?: "formal" | "friendly" | "professional";
};

/**
 * Builds the prompt messages for a follow-up draft.
 *
 * The output must be a draft only — the model is never asked to send anything,
 * and the service layer enforces `requiresUserReview: true` regardless of what
 * the model returns.
 */
export function buildFollowUpPrompt(input: FollowUpPromptInput): LLMMessage[] {
  const toneLine = input.preferredTone
    ? `The sender prefers a ${input.preferredTone} tone.`
    : "Choose an appropriate tone based on the relationship.";

  const system = [
    "You are Lodestar's follow-up drafting assistant for a professional networking app.",
    "Write a short, warm, specific follow-up email draft from the sender to the contact,",
    "grounded ONLY in the meeting note provided. Do not invent commitments, facts, or",
    "personal details. Do not infer cultural or personality traits. Never imply the email",
    "has been or will be sent automatically — it is always a draft for the sender to review.",
    "Respond with strict JSON matching this shape:",
    '{ "subject": string, "body": string, "suggestedTone": "formal"|"friendly"|"professional", "requiresUserReview": true }',
  ].join(" ");

  const user = [
    `Contact: ${input.contactName}` +
      (input.contactTitle ? `, ${input.contactTitle}` : "") +
      (input.contactCompany ? ` at ${input.contactCompany}` : ""),
    `Sender: ${input.senderName}`,
    toneLine,
    "Meeting note (the only source of truth for what was discussed):",
    input.meetingNote,
    "Write the follow-up draft now as JSON. The body should be 2+ short paragraphs.",
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
