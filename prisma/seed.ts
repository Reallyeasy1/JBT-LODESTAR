import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEMO_USER_ID = "clu00000000000000000001";
const DEMO_EVENT_ID = "cle00000000000000000001";

const contacts = [
  {
    id: "con0000000000000000000001",
    fullName: "Sarah Tan",
    title: "Managing Partner",
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
    title: "CTO",
    company: "BeyondFit",
    email: "daniel@beyondfit.io",
    linkedinUrl: "https://linkedin.com/in/danielwong-cto",
    languages: ["English", "Mandarin"],
    tags: ["technical", "ai-collaborator", "health-tech"],
    notes:
      "Building AI personalisation for fitness. Their infra team uses similar LLM orchestration patterns to ours. Open to API integration or white-label. Demo our ranking API to him.",
    sourceType: "qr_code",
    sourceConfidence: 0.99,
  },
  {
    id: "con0000000000000000000003",
    fullName: "Mei Nakamura",
    title: "Head of Product",
    company: "Stripe Singapore",
    email: "mei.nakamura@stripe.com",
    linkedinUrl: "https://linkedin.com/in/meinakamura",
    languages: ["Japanese", "English"],
    tags: ["enterprise", "pilot-customer", "payments"],
    notes:
      "Running internal hackathon tooling evaluation at Stripe. Specifically asked about how we handle post-event follow-up fatigue. Could be a pilot customer for enterprise tier.",
    sourceType: "vcf",
    sourceConfidence: 0.98,
  },
  {
    id: "con0000000000000000000004",
    fullName: "Priya Menon",
    title: "Senior Recruiter",
    company: "Shopee",
    email: "priya.menon@shopee.com",
    languages: ["English", "Tamil"],
    tags: ["recruiter", "talent"],
    notes: "Recruiting for engineering roles at Shopee. Not directly relevant to current goals.",
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
    title: "Full-Stack Developer",
    company: "CodeCraft Labs",
    email: "aaron@codecraftlabs.sg",
    linkedinUrl: "https://linkedin.com/in/aaronlee-dev",
    languages: ["English", "Mandarin"],
    tags: ["developer", "open-source"],
    notes:
      "Interested in contributing to open-source tooling. Could be a collaborator on SDK or developer community angle.",
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
      eventGoal: "Find seed investor and at least one enterprise pilot customer for Lodestar.",
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
