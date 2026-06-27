import { Prisma, PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEMO_USER_ID = "clu00000000000000000001";
const DEMO_EVENT_ID = "cle00000000000000000001";
const DEMO_RANKING_ID = "clr00000000000000000001";
const DEMO_EVENT_GOAL = "Find investors, pilot customers, and AI/backend collaborators for Lodestar.";

const contacts = [
  {
    id: "con0000000000000000000001",
    fullName: "Sarah Tan",
    title: "Partner",
    company: "Seed Ventures",
    email: "sarah.tan@seedventures.vc",
    linkedinUrl: "https://linkedin.com/in/sarahtan-sv",
    languages: ["Japanese", "English", "Mandarin"],
    tags: ["investor", "seed-stage", "ai-focus"],
    notes:
      "Led $2M seed into 3 AI startups this year. Actively looking for pre-seed AI infrastructure plays. Mentioned she values founders who understand go-to-market in Asia. Follow up about our Singapore expansion timeline.",
    sourceType: "business_card",
    sourceConfidence: 0.95,
  },
  {
    id: "con0000000000000000000002",
    fullName: "Daniel Wong",
    title: "Enterprise Innovation Lead",
    company: "DBS",
    email: "daniel.wong@dbs.com",
    linkedinUrl: "https://linkedin.com/in/danielwong-dbs",
    languages: ["English", "Mandarin"],
    tags: ["pilot-customer", "enterprise", "banking"],
    notes:
      "Leads enterprise innovation pilots for DBS. Asked how Lodestar could help relationship managers turn event meetings into clear next actions. Follow up with a short pilot proposal.",
    sourceType: "qr_code",
    sourceConfidence: 0.99,
  },
  {
    id: "con0000000000000000000003",
    fullName: "Mei Nakamura",
    title: "AI Platform Engineer",
    company: "Rakuten",
    email: "mei.nakamura@rakuten.com",
    linkedinUrl: "https://linkedin.com/in/meinakamura-rakuten",
    languages: ["Japanese", "English"],
    tags: ["technical", "ai-collaborator", "platform"],
    notes:
      "Works on AI platform infrastructure at Rakuten. Interested in deterministic workflows around LLM output validation and agent run logging. Good technical collaborator for backend architecture.",
    sourceType: "vcf",
    sourceConfidence: 0.98,
  },
  {
    id: "con0000000000000000000004",
    fullName: "Priya Menon",
    title: "Technical Recruiter",
    company: "ByteDance",
    email: "priya.menon@bytedance.com",
    languages: ["English", "Tamil"],
    tags: ["recruiter", "talent"],
    notes: "Recruiting for AI infrastructure and backend engineering roles at ByteDance. Useful talent contact, but less relevant than investors, pilot customers, or collaborators for this event goal.",
    sourceType: "business_card",
    sourceConfidence: 0.9,
  },
  {
    id: "con0000000000000000000005",
    fullName: "Sarah T.",
    title: "Partner",
    company: "Seed Ventures",
    email: null,
    linkedinUrl: null,
    languages: ["English"],
    tags: ["investor"],
    notes: "Met briefly. Same company as Sarah Tan - possible duplicate or different partner.",
    sourceType: "manual",
    sourceConfidence: 0.6,
  },
  {
    id: "con0000000000000000000006",
    fullName: "Aaron Lee",
    title: "Founder",
    company: "EventOps",
    email: "aaron@eventops.sg",
    linkedinUrl: "https://linkedin.com/in/aaronlee-eventops",
    languages: ["English", "Mandarin"],
    tags: ["event-organiser", "pilot-customer", "founder"],
    notes:
      "Runs EventOps, a tool suite for conference organisers. Asked whether Lodestar can help sponsors and attendees prioritise follow-ups after events. Potential pilot customer and event organiser partner.",
    sourceType: "qr_code",
    sourceConfidence: 0.97,
  },
];

const rankingItems = [
  {
    contactId: "con0000000000000000000001",
    rankPosition: 1,
    score: 93,
    opportunityType: "investor",
    reasoning: "Sarah Tan is the strongest investor match because her notes explicitly mention pre-seed AI infrastructure interest and Singapore expansion fit.",
    nextAction: "Follow up about our Singapore expansion timeline.",
    confidence: 95,
    evidence: {
      signals: [
        "Partner at Seed Ventures",
        "Led $2M seed into 3 AI startups this year",
        "Actively looking for pre-seed AI infrastructure plays",
      ],
      scoreBreakdown: {
        goalMatch: 25,
        roleRelevance: 15,
        decisionInfluence: 13,
        companyIndustryFit: 10,
        sharedContext: 9,
        followupClarity: 10,
        reciprocity: 5,
        freshness: 5,
        evidenceConfidence: 5,
      },
    },
  },
  {
    contactId: "con0000000000000000000002",
    rankPosition: 2,
    score: 86,
    opportunityType: "customer",
    reasoning: "Daniel Wong is a high-value pilot customer lead because he owns enterprise innovation pilots and asked about relationship-manager event follow-up workflows.",
    nextAction: "Follow up with a short pilot proposal.",
    confidence: 92,
    evidence: {
      signals: [
        "Enterprise Innovation Lead at DBS",
        "Asked how Lodestar could help relationship managers",
        "Clear pilot proposal next action",
      ],
      scoreBreakdown: {
        goalMatch: 23,
        roleRelevance: 13,
        decisionInfluence: 8,
        companyIndustryFit: 10,
        sharedContext: 8,
        followupClarity: 10,
        reciprocity: 5,
        freshness: 5,
        evidenceConfidence: 4,
      },
    },
  },
  {
    contactId: "con0000000000000000000006",
    rankPosition: 3,
    score: 82,
    opportunityType: "customer",
    reasoning: "Aaron Lee is both a pilot customer and event organiser partner, with direct interest in sponsor and attendee follow-up prioritisation.",
    nextAction: "Share a demo focused on sponsor and attendee follow-up prioritisation.",
    confidence: 90,
    evidence: {
      signals: [
        "Founder at EventOps",
        "Potential pilot customer and event organiser partner",
        "Asked about sponsor and attendee prioritisation",
      ],
      scoreBreakdown: {
        goalMatch: 22,
        roleRelevance: 13,
        decisionInfluence: 15,
        companyIndustryFit: 8,
        sharedContext: 8,
        followupClarity: 7,
        reciprocity: 4,
        freshness: 5,
        evidenceConfidence: 5,
      },
    },
  },
  {
    contactId: "con0000000000000000000003",
    rankPosition: 4,
    score: 76,
    opportunityType: "collaborator",
    reasoning: "Mei Nakamura is a strong technical collaborator for deterministic workflows, validation, and agent run logging.",
    nextAction: "Send architecture notes on deterministic LLM output validation and agent run logging.",
    confidence: 88,
    evidence: {
      signals: [
        "AI Platform Engineer at Rakuten",
        "Interested in deterministic workflows",
        "Good technical collaborator for backend architecture",
      ],
      scoreBreakdown: {
        goalMatch: 21,
        roleRelevance: 12,
        decisionInfluence: 4,
        companyIndustryFit: 10,
        sharedContext: 8,
        followupClarity: 8,
        reciprocity: 4,
        freshness: 5,
        evidenceConfidence: 4,
      },
    },
  },
  {
    contactId: "con0000000000000000000004",
    rankPosition: 5,
    score: 47,
    opportunityType: "recruiter",
    reasoning: "Priya Menon is useful for future hiring, but less aligned with the immediate investor, pilot customer, and collaborator goals.",
    nextAction: "Keep warm for future AI infrastructure hiring needs.",
    confidence: 75,
    evidence: {
      signals: [
        "Technical Recruiter at ByteDance",
        "Recruiting for AI infrastructure and backend engineering roles",
        "Less relevant than investors, pilot customers, or collaborators",
      ],
      scoreBreakdown: {
        goalMatch: 7,
        roleRelevance: 6,
        decisionInfluence: 4,
        companyIndustryFit: 8,
        sharedContext: 6,
        followupClarity: 5,
        reciprocity: 3,
        freshness: 5,
        evidenceConfidence: 3,
      },
    },
  },
  {
    contactId: "con0000000000000000000005",
    rankPosition: 6,
    score: 32,
    opportunityType: "investor",
    reasoning: "Sarah T. may be related to the top investor lead, but weak evidence and duplicate risk keep this record low priority until resolved.",
    nextAction: "Confirm whether this record is a duplicate before outreach.",
    confidence: 55,
    evidence: {
      signals: [
        "Partner at Seed Ventures",
        "Possible duplicate of Sarah Tan",
        "Sparse contact evidence",
      ],
      scoreBreakdown: {
        goalMatch: 10,
        roleRelevance: 8,
        decisionInfluence: 5,
        companyIndustryFit: 3,
        sharedContext: 2,
        followupClarity: 2,
        reciprocity: 0,
        freshness: 1,
        evidenceConfidence: 1,
      },
    },
  },
];

async function main() {
  console.log("Seeding demo data...");

  await db.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "alex@lodestar.ai",
      name: "Alex Tan",
    },
  });

  await db.userProfile.upsert({
    where: { userId: DEMO_USER_ID },
    update: {},
    create: {
      userId: DEMO_USER_ID,
      displayName: "Alex Tan",
      title: "Founder",
      company: "Lodestar",
      networkingGoals: ["find seed investor", "sign first enterprise pilot", "recruit founding engineer"],
      whatIOffer: ["AI product expertise", "Southeast Asia market access", "early-stage traction"],
      preferredTone: "direct",
    },
  });

  await db.event.upsert({
    where: { id: DEMO_EVENT_ID },
    update: {},
    create: {
      id: DEMO_EVENT_ID,
      userId: DEMO_USER_ID,
      name: "Sup Build2026 Hackathon",
      location: "Singapore",
      startDate: new Date("2026-06-27"),
      endDate: new Date("2026-06-28"),
      industry: "AI/Startups",
      description: "48-hour hackathon focused on AI infrastructure and developer tools.",
      eventGoal: DEMO_EVENT_GOAL,
      tags: ["hackathon", "ai", "startups", "singapore"],
    },
  });

  for (const contact of contacts) {
    await db.contact.upsert({
      where: { id: contact.id },
      update: {},
      create: {
        ...contact,
        userId: DEMO_USER_ID,
        eventId: DEMO_EVENT_ID,
      },
    });
  }

  await db.ranking.deleteMany({
    where: {
      userId: DEMO_USER_ID,
      eventId: DEMO_EVENT_ID,
      id: { not: DEMO_RANKING_ID },
    },
  });

  await db.ranking.upsert({
    where: { id: DEMO_RANKING_ID },
    update: {
      goalText: DEMO_EVENT_GOAL,
      modelName: "deterministic-seed-v1",
      promptVersion: "seed-ranking-v1",
    },
    create: {
      id: DEMO_RANKING_ID,
      userId: DEMO_USER_ID,
      eventId: DEMO_EVENT_ID,
      goalText: DEMO_EVENT_GOAL,
      modelName: "deterministic-seed-v1",
      promptVersion: "seed-ranking-v1",
    },
  });

  await db.rankingItem.deleteMany({
    where: { rankingId: DEMO_RANKING_ID },
  });

  await db.rankingItem.createMany({
    data: rankingItems.map((item) => ({
      rankingId: DEMO_RANKING_ID,
      contactId: item.contactId,
      rankPosition: item.rankPosition,
      score: item.score,
      opportunityType: item.opportunityType,
      reasoning: item.reasoning,
      nextAction: item.nextAction,
      confidence: item.confidence,
      evidence: item.evidence as Prisma.InputJsonValue,
    })),
  });

  console.log(`Seeded: 1 user, 1 event, ${contacts.length} contacts, 1 ranking`);
  console.log("Sarah Tan + Sarah T. are the intentional duplicate pair for identity resolution demo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
