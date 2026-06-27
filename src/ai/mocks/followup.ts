import { FollowUpPromptInput } from "@/ai/prompts/followup";
import { FollowUpOutput } from "@/ai/schemas/followup.schema";

export function createMockFollowUp(input: FollowUpPromptInput): FollowUpOutput {
  const contactName = input.contact.fullName?.trim() || "there";
  const senderName = input.user.displayName?.trim() || "Alex";
  const topic = input.meetingNote.trim().replace(/[.!?]+$/, "");

  return {
    subject: `Following up on our conversation`,
    draftText: `Hi ${contactName},\n\nIt was great meeting you. I appreciated our conversation, especially this point: ${topic}.\n\nIf it would be useful, I would be glad to continue the conversation and agree on one practical next step.\n\nBest,\n${senderName}`,
    recommendedTiming: "Within 24 hours",
    reasoning: "The draft references only the confirmed meeting note and proposes a low-pressure next step.",
    confidence: 90,
    warnings: [],
    requiresUserReview: true,
  };
}
