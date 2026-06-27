import { z } from "zod";

export const FollowUpOutputSchema = z.object({
  subject: z.string().min(1),
  draftText: z.string().min(1),
  recommendedTiming: z.string().min(1),
  reasoning: z.string().min(1),
  confidence: z.number().min(0).max(1),
  requiresUserReview: z.literal(true),
});

export type FollowUpOutput = z.infer<typeof FollowUpOutputSchema>;
