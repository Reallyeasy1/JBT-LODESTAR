import { z } from "zod";

export const BriefingOutputSchema = z.object({
  personSummary: z.string().min(1),
  whyTheyMatter: z.string().min(1),
  likelyGoal: z.string().min(1).optional(),
  decisionAuthority: z.enum(["budget_holder", "influencer", "gatekeeper", "end_user", "unknown"]),
  talkingPoints: z.array(z.string().min(1)).min(3),
  questionsToAsk: z.array(z.string().min(1)).min(2),
  culturalNotes: z.array(z.string().min(1)).default([]),
  warnings: z.array(z.string().min(1)).default([]),
  confidenceScore: z.number().min(0).max(100),
});

export type BriefingOutput = z.infer<typeof BriefingOutputSchema>;
