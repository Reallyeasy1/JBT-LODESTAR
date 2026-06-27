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

const seededDemoContacts = [
  sarah,
  contact({
    id: "daniel",
    fullName: "Daniel Wong",
    title: "CTO",
    company: "BeyondFit",
    tags: ["technical", "ai-collaborator", "health-tech"],
    notes:
      "Building AI personalisation for fitness. Their infra team uses similar LLM orchestration patterns to ours. Open to API integration or white-label. Demo our ranking API to him.",
  }),
  contact({
    id: "mei",
    fullName: "Mei Nakamura",
    title: "Head of Product",
    company: "Stripe Singapore",
    tags: ["enterprise", "pilot-customer", "payments"],
    notes:
      "Running internal hackathon tooling evaluation at Stripe. Specifically asked about how we handle post-event follow-up fatigue. Could be a pilot customer for enterprise tier.",
  }),
  priya,
  contact({
    id: "sarah-t",
    fullName: "Sarah T.",
    title: "Partner",
    company: "Seed Ventures",
    email: null,
    linkedinUrl: null,
    sourceType: "manual",
    sourceConfidence: 0.6,
    tags: ["investor"],
    notes: "Met briefly. Same company as Sarah Tan — possible duplicate or different partner.",
  }),
  contact({
    id: "aaron",
    fullName: "Aaron Lee",
    title: "Full-Stack Developer",
    company: "CodeCraft Labs",
    tags: ["developer", "open-source"],
    notes:
      "Interested in contributing to open-source tooling. Could be a collaborator on SDK or developer community angle.",
  }),
];

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

test("keeps Sarah Tan first for the seeded demo goal", () => {
  const goal = "Find investors, pilot customers, and AI/backend collaborators";
  const ranked = rankContactRecords(seededDemoContacts, goal, "AI/Startups", now);
  assert.equal(ranked[0].contactId, "sarah");
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].opportunityType, "investor");
  RankingOutputSchema.parse({ eventId: "event-1", goal, rankedContacts: ranked });
});
