import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEMO_USER_ID = "clu00000000000000000001";
const DEMO_EVENT_ID = "cle00000000000000000001";

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
    notes: "Met briefly. Same company as Sarah Tan — possible duplicate or different partner.",
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
      eventGoal: "Find investors, pilot customers, and AI/backend collaborators for Lodestar.",
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

  console.log(`Seeded: 1 user, 1 event, ${contacts.length} contacts`);
  console.log("Sarah Tan + Sarah T. are the intentional duplicate pair for identity resolution demo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
