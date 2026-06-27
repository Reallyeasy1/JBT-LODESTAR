import { z } from "zod";

export const LocalisationOutputSchema = z.object({
  localisationId: z.string().min(1).optional(),
  openerText: z.string().min(1),
  languageUsed: z.string().min(1),
  confidenceScore: z.number().min(0).max(100),
  warnings: z.array(z.string().min(1)),
});

export type LocalisationOutput = z.infer<typeof LocalisationOutputSchema>;
