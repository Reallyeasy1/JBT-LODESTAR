import type { BriefingOutput } from "@/ai/schemas/briefing.schema";
import type { FollowUpOutput } from "@/ai/schemas/followup.schema";

type JsonRecord = Record<string, unknown>;

export type AiStructuredTask = "briefing" | "followup";

export type AiStructuredResponse<TOutput> = {
  output: TOutput;
  modelName: string;
  tokenInput: number;
  tokenOutput: number;
};

export async function generateStructuredOutput<TOutput>(params: {
  task: AiStructuredTask;
  input: JsonRecord;
}): Promise<AiStructuredResponse<TOutput>> {
  const output =
    params.task === "briefing" ? generateMockBriefing(params.input) : generateMockFollowUp(params.input);

  return {
    output: output as TOutput,
    modelName: "mock-lodestar",
    tokenInput: estimateTokenCount(params.input),
    tokenOutput: estimateTokenCount(output),
  };
}

function generateMockBriefing(input: JsonRecord): BriefingOutput {
  const contact = readRecord(input.contact);
  const event = readRecord(input.event);
  const userProfile = readRecord(input.userProfile);

  const fullName = readString(contact.fullName, "this contact");
  const title = readString(contact.title, "Contact");
  const company = readString(contact.company, "their organisation");
  const notes = readString(contact.notes, "");
  const eventGoal = readString(event.eventGoal, "the event goal");
  const userCompany = readString(userProfile.company, "your team");
  const languages = readStringArray(contact.languages);

  const decisionAuthority = inferDecisionAuthority(`${title} ${notes}`);
  const culturalNotes =
    languages.length > 0
      ? [
          `Their profile lists ${languages.join(" and ")} as stated language preferences; open in the most relevant shared language and let them set the depth.`,
        ]
      : [];

  return {
    personSummary: `${fullName} is ${withArticle(title)} at ${company}. Their notes suggest a practical conversation around ${notes || eventGoal}.`,
    whyTheyMatter: `${company} appears relevant to the goal: ${eventGoal}. The clearest angle is whether ${userCompany} can help with their current priorities.`,
    likelyGoal: `Explore useful event relationships around ${eventGoal}.`,
    decisionAuthority,
    talkingPoints: [
      `Ask how ${company} is approaching ${eventGoal.toLowerCase()}.`,
      `Share the most relevant Lodestar use case for ${title.toLowerCase()} priorities.`,
      "Confirm what a useful next step would look like after the event.",
    ],
    questionsToAsk: [
      "What would make this event a success for you?",
      "Who else on your team should be involved if this is worth exploring?",
    ],
    culturalNotes,
    warnings: [],
    confidenceScore: inferConfidence(contact),
  };
}

function generateMockFollowUp(input: JsonRecord): FollowUpOutput {
  const contact = readRecord(input.contact);
  const interaction = readRecord(input.interaction);
  const event = readRecord(input.event);
  const userProfile = readRecord(input.userProfile);

  const fullName = readString(contact.fullName, "there");
  const firstName = fullName.split(" ")[0] || fullName;
  const company = readString(contact.company, "your team");
  const userName = readString(userProfile.displayName, "Alex");
  const eventName = readString(event.name, "the event");
  const notes = readString(interaction.userNotes, "").trim();
  const sparseNotes = notes.length < 24;
  const noteSentence = sparseNotes
    ? "I enjoyed connecting and would like to continue the conversation while the event is still fresh."
    : `I especially noted: ${notes}`;

  return {
    subject: `Great meeting you at ${eventName}`,
    draftText: `Hi ${firstName},\n\nIt was great meeting you at ${eventName}. ${noteSentence}\n\nIf useful, I would be happy to share a short note on how Lodestar could support ${company}'s post-event follow-up workflow.\n\nBest,\n${userName}`,
    recommendedTiming: sparseNotes ? "within 24 hours" : "today or tomorrow",
    reasoning: sparseNotes
      ? "The meeting notes are sparse, so the draft keeps the ask lightweight and avoids over-personalising."
      : "The draft anchors on the user's meeting note and proposes a clear next step without sending anything externally.",
    confidence: sparseNotes ? 0.58 : 0.82,
    requiresUserReview: true,
  };
}

function inferDecisionAuthority(text: string): BriefingOutput["decisionAuthority"] {
  const lowered = text.toLowerCase();
  if (/\b(founder|ceo|partner|principal|head|vp|chief|director)\b/.test(lowered)) {
    return "budget_holder";
  }
  if (/\b(lead|manager|innovation|platform|engineer)\b/.test(lowered)) {
    return "influencer";
  }
  if (/\b(recruiter|talent)\b/.test(lowered)) {
    return "gatekeeper";
  }
  return "unknown";
}

function inferConfidence(contact: JsonRecord): number {
  const fields = ["fullName", "title", "company", "email", "notes"].filter((field) =>
    Boolean(contact[field])
  ).length;
  const sourceConfidence = typeof contact.sourceConfidence === "number" ? contact.sourceConfidence : 0.75;
  const completeness = fields / 5;
  return Math.round(Math.max(35, Math.min(95, (completeness * 70 + sourceConfidence * 30))));
}

function estimateTokenCount(value: unknown): number {
  return Math.max(1, Math.ceil(JSON.stringify(value).length / 4));
}

function readRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function withArticle(value: string): string {
  return /^[aeiou]/i.test(value) ? `an ${value}` : `a ${value}`;
}
