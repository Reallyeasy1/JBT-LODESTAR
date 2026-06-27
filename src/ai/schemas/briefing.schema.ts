import { z } from "zod";

/**
 * Canonical Zod schema for contact briefing output.
 *
 * Every AI-generated briefing MUST be parsed through this schema before it is
 * verified or saved. See `okf/workflows/briefing-generation.md`.
 */
export const DecisionAuthorityEnum = z.enum([
  "budget_holder",
  "influencer",
  "gatekeeper",
  "end_user",
  "unknown",
]);

export type DecisionAuthority = z.infer<typeof DecisionAuthorityEnum>;

export const BriefingOutputSchema = z.object({
  /** 1-2 sentence professional overview of the contact. */
  personSummary: z.string(),
  /** Goal-relative relevance: why this contact matters for the user's goal. */
  whyTheyMatter: z.string(),
  /** Optional inference of what the contact is trying to achieve at the event. */
  likelyGoal: z.string().optional(),
  /** Decision authority bucket. Never inferred from demographics. */
  decisionAuthority: DecisionAuthorityEnum,
  /** Exactly 3 specific, contextual conversation starters. */
  talkingPoints: z.array(z.string()).min(3).max(3),
  /** Exactly 2 questions to learn what the user needs to know. */
  questionsToAsk: z.array(z.string()).min(2).max(2),
  /** Cautious, stated-preference-only cultural notes. Never demographic inference. */
  culturalNotes: z.array(z.string()),
  /** Anti-stereotyping / overconfidence flags from the verification service. */
  warnings: z.array(z.string()),
  /** 0-100 reflecting data completeness and source confidence. */
  confidenceScore: z.number().min(0).max(100),
});

export type BriefingOutput = z.infer<typeof BriefingOutputSchema>;
