import assert from "node:assert/strict";
import test from "node:test";
import { ContactScoreBreakdownSchema, RankingOutputSchema } from "@/ai/schemas/ranking.schema";
import { RankableContact, rankContactRecords, scoreContactForGoal } from "@/services/ranking-score";

const now = new Date("2026-06-27T12:00:00.000Z");

function contact(overrides: Partial<RankableContact>): RankableContact {
  return {
    id: "contact-default",
    fullName: "Default Contact",
    title: "Contributor",
    company: "Example Co",
    email: "contact@example.com",
    phone: null,
    linkedinUrl: null,
    websiteUrl: null,
    languages: ["English"],
    sourceType: "manual",
    sourceConfidence: 0.9,
    tags: [],
    notes: "Met at the event.",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const sarah = contact({
  id: "sarah",
  fullName: "Sarah Tan",
  title: "Managing Partner",
  company: "Seed Ventures",
  tags: ["investor", "seed-stage", "ai-focus"],
  notes: "Actively looking for pre-seed AI startups. Follow up with the Singapore expansion timeline.",
});

const priya = contact({
  id: "priya",
  fullName: "Priya Menon",
  title: "Senior Recruiter",
  company: "Shopee",
  tags: ["recruiter", "talent"],
  notes: "Recruiting for engineering roles. Not directly relevant to current goals.",
});

test("scores every dimension within its declared range and totals to the final score", () => {
  const result = scoreContactForGoal(sarah, "Find investors", "AI/Startups", now);
  ContactScoreBreakdownSchema.parse(result.scoreBreakdown);
  assert.equal(
    result.score,
    Object.values(result.scoreBreakdown).reduce((total, value) => total + value, 0),
  );
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("ranks the investor above the recruiter for an investor goal", () => {
  const ranked = rankContactRecords([priya, sarah], "Find investors", "AI/Startups", now);
  assert.equal(ranked[0].contactId, "sarah");
  assert.equal(ranked[0].rank, 1);
  assert.ok(ranked[0].score > ranked[1].score);
  RankingOutputSchema.parse({ eventId: "event-1", goal: "Find investors", rankedContacts: ranked });
});
