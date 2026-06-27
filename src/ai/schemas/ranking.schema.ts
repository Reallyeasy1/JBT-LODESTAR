import { z } from "zod";

export const ContactScoreBreakdownSchema = z.object({
  goalMatch: z.number().int().min(0).max(25),
  roleRelevance: z.number().int().min(0).max(15),
  decisionInfluence: z.number().int().min(0).max(15),
  companyIndustryFit: z.number().int().min(0).max(10),
  sharedContext: z.number().int().min(0).max(10),
  followupClarity: z.number().int().min(0).max(10),
  reciprocity: z.number().int().min(0).max(5),
  freshness: z.number().int().min(0).max(5),
  evidenceConfidence: z.number().int().min(0).max(5),
});

export const OpportunityTypeSchema = z.enum([
  "investor",
  "customer",
  "collaborator",
  "mentor",
  "hire",
  "recruiter",
  "friend",
  "other",
]);

export const RankedContactSchema = z.object({
  contactId: z.string().min(1),
  rank: z.number().int().positive(),
  score: z.number().int().min(0).max(100),
  scoreBreakdown: ContactScoreBreakdownSchema,
  opportunityType: OpportunityTypeSchema,
  reasoning: z.string().min(1),
  nextAction: z.string().min(1),
  confidence: z.number().int().min(0).max(100),
  evidence: z.array(z.string().min(1)).min(1),
});

export const RankingOutputSchema = z.object({
  rankingId: z.string().min(1).optional(),
  eventId: z.string().min(1),
  goal: z.string().min(1),
  rankedContacts: z.array(RankedContactSchema).min(1),
});

export type ContactScoreBreakdown = z.infer<typeof ContactScoreBreakdownSchema>;
export type OpportunityType = z.infer<typeof OpportunityTypeSchema>;
export type RankedContact = z.infer<typeof RankedContactSchema>;
export type RankingOutput = z.infer<typeof RankingOutputSchema>;
