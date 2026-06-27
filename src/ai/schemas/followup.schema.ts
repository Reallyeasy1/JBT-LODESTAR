import { z } from "zod";

/**
 * Canonical output schema for AI-generated follow-up drafts.
 *
 * `requiresUserReview` is a Zod LITERAL `true` — not `z.boolean()` with a
 * default. This makes it structurally impossible for any code path to produce
 * a valid follow-up that skips human review. A follow-up is always a draft.
 */
export const FollowUpOutputSchema = z.object({
  subject: z.string().min(1),
  body: z.string().min(1),
  suggestedTone: z.enum(["formal", "friendly", "professional"]),
  requiresUserReview: z.literal(true),
});

export type FollowUpOutput = z.infer<typeof FollowUpOutputSchema>;
