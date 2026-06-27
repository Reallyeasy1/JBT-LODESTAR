import assert from "node:assert/strict";
import test from "node:test";
import { BriefingOutputSchema } from "@/ai/schemas/briefing.schema";
import { FollowUpOutputSchema } from "@/ai/schemas/followup.schema";
import { RankingOutputSchema } from "@/ai/schemas/ranking.schema";

test("ranking confidence uses whole-number percentage semantics", () => {
  const parsed = RankingOutputSchema.parse({
    eventId: "event-1",
    goal: "Find investors",
    rankedContacts: [
      {
        contactId: "contact-1",
        rank: 1,
        score: 88,
        scoreBreakdown: {
          goalMatch: 20,
          roleRelevance: 12,
          decisionInfluence: 12,
          companyIndustryFit: 8,
          sharedContext: 8,
          followupClarity: 10,
          reciprocity: 5,
          freshness: 5,
          evidenceConfidence: 5,
        },
        opportunityType: "investor",
        reasoning: "Strong goal alignment and explicit next action.",
        nextAction: "Share a concise pilot update by tomorrow.",
        confidence: 87,
        evidence: ["Relevant title", "Clear follow-up note"],
      },
    ],
  });
  assert.equal(parsed.rankedContacts[0].confidence, 87);
  assert.throws(() =>
    RankingOutputSchema.parse({
      ...parsed,
      rankedContacts: [{ ...parsed.rankedContacts[0], confidence: 0.87 }],
    }),
  );
});

test("follow-up confidence uses whole-number percentage semantics", () => {
  const parsed = FollowUpOutputSchema.parse({
    subject: "Following up",
    draftText: "Draft body",
    recommendedTiming: "Within 24 hours",
    reasoning: "Grounded in confirmed meeting notes.",
    confidence: 90,
    warnings: [],
    requiresUserReview: true,
  });
  assert.equal(parsed.confidence, 90);
  assert.throws(() => FollowUpOutputSchema.parse({ ...parsed, confidence: 0.9 }));
});

test("briefing decision authority uses product-facing role buckets", () => {
  assert.equal(
    BriefingOutputSchema.parse({
      personSummary: "Summary",
      whyTheyMatter: "Why",
      decisionAuthority: "budget_holder",
      talkingPoints: ["A", "B", "C"],
      questionsToAsk: ["Q1", "Q2"],
      culturalNotes: ["Use explicit language preference only."],
      warnings: [],
      confidenceScore: 88,
    }).decisionAuthority,
    "budget_holder",
  );

  assert.throws(() =>
    BriefingOutputSchema.parse({
      personSummary: "Summary",
      whyTheyMatter: "Why",
      decisionAuthority: "high",
      talkingPoints: ["A", "B", "C"],
      questionsToAsk: ["Q1", "Q2"],
      culturalNotes: ["Use explicit language preference only."],
      warnings: [],
      confidenceScore: 88,
    }),
  );
});
