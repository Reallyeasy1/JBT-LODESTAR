import { z } from "zod";

export const DecisionAuthoritySchema = z.enum([
  "budget_holder",
  "influencer",
  "gatekeeper",
  "end_user",
  "unknown",
]);

export const BriefingOutputSchema = z.object({
  briefingId: z.string().min(1).optional(),
  personSummary: z.string().min(1),
  whyTheyMatter: z.string().min(1),
  likelyGoal: z.string().min(1).optional(),
  decisionAuthority: DecisionAuthoritySchema,
  talkingPoints: z.array(z.string().min(1)).length(3),
  questionsToAsk: z.array(z.string().min(1)).length(2),
  culturalNotes: z.array(z.string().min(1)),
  warnings: z.array(z.string().min(1)),
  confidenceScore: z.number().min(0).max(100),
});

export type BriefingOutput = z.infer<typeof BriefingOutputSchema>;
