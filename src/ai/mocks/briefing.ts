import { BriefingOutput } from "@/ai/schemas/briefing.schema";
import { BriefingPromptInput } from "@/ai/prompts/briefing";

function authorityFor(title: string | null): BriefingOutput["decisionAuthority"] {
  const normalised = title?.toLowerCase() ?? "";
  if (/managing partner|founder|chief|ceo|cto|cfo|coo/.test(normalised)) return "budget_holder";
  if (/partner|vp|vice president|head|director/.test(normalised)) return "influencer";
  if (/recruiter|talent/.test(normalised)) return "gatekeeper";
  if (/engineer|developer|specialist/.test(normalised)) return "end_user";
  return "unknown";
}

export function createMockBriefing(input: BriefingPromptInput): BriefingOutput {
  const name = input.contact.fullName ?? "This contact";
  const role = input.contact.title ?? "a professional contact";
  const company = input.contact.company ? ` at ${input.contact.company}` : "";
  const goal = input.event.goal ?? "the user's networking goal";
  const explicitNote = input.contact.notes?.trim();
  const preferredLanguage = input.contact.languages[0];
  const evidenceCount = [
    input.contact.fullName,
    input.contact.title,
    input.contact.company,
    explicitNote,
    input.contact.tags.length > 0,
    input.contact.languages.length > 0,
  ].filter(Boolean).length;

  return {
    personSummary: `${name} is ${role}${company}.`,
    whyTheyMatter: explicitNote
      ? `Their event context is relevant to “${goal}”: ${explicitNote}`
      : `Their role may be relevant to “${goal}”, but more interaction context is needed.`,
    likelyGoal: explicitNote ? "Explore a relevant professional next step" : "Unknown — ask directly",
    decisionAuthority: authorityFor(input.contact.title),
    talkingPoints: [
      `Connect the conversation to the event goal: ${goal}.`,
      explicitNote ? `Return to the confirmed note: ${explicitNote}` : "Ask what brought them to the event.",
      input.contact.tags.length > 0
        ? `Explore the stated topics: ${input.contact.tags.join(", ")}.`
        : "Confirm one area of mutual professional interest.",
    ],
    questionsToAsk: [
      "What outcome would make this event valuable for you?",
      "Would a specific follow-up next week be useful?",
    ],
    culturalNotes: preferredLanguage
      ? [
          `Their profile explicitly lists ${preferredLanguage} as a preferred language. Ask before switching from the current conversation language.`,
        ]
      : ["No language preference is recorded. Use the user's default professional tone."],
    warnings: explicitNote ? [] : ["Limited interaction evidence; confirm relevance directly."],
    confidenceScore: Math.min(95, 45 + evidenceCount * 8),
  };
}
