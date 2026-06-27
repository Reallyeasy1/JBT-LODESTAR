export type Contact = {
  id: string;
  initials: string;
  name: string;
  role: string;
  company: string;
  score: number;
  opportunity: string;
  reason: string;
  nextAction: string;
  status: "Act today" | "This week" | "Explore";
  accent: string;
  tags: string[];
  evidence: string[];
  opener: string;
  questions: string[];
  culturalNote?: string;
};

export const demoContacts: Contact[] = [
  {
    id: "sarah-tan",
    initials: "ST",
    name: "Sarah Tan",
    role: "Partner",
    company: "Northstar Ventures",
    score: 92,
    opportunity: "Investor",
    reason:
      "Strong fundraising match with an explicit interest in early-stage AI workflow products.",
    nextAction: "Send the event-organiser wedge update by tomorrow morning.",
    status: "Act today",
    accent: "amber",
    tags: ["Seed investor", "AI workflows", "Warm signal"],
    evidence: [
      "Her event profile lists early-stage AI and B2B software.",
      "Your note says she asked about the initial buyer and distribution path.",
      "She invited you to share what you learn from organiser interviews.",
    ],
    opener:
      "Your question about whether event organisers are the stronger buyer changed how I’m framing the first pilot.",
    questions: [
      "What evidence would make the event-networking wedge feel investable?",
      "Which early-stage adoption signal would you prioritise first?",
    ],
    culturalNote:
      "No language preference is known. Use the concise English tone already established in your conversation.",
  },
  {
    id: "marcus-lee",
    initials: "ML",
    name: "Marcus Lee",
    role: "Innovation Lead",
    company: "Asteria Group",
    score: 86,
    opportunity: "Pilot customer",
    reason:
      "Owns internal event programmes and mentioned a concrete problem with post-event lead follow-through.",
    nextAction: "Propose a 20-minute pilot discovery call this week.",
    status: "This week",
    accent: "sage",
    tags: ["Enterprise", "Event owner", "Buyer signal"],
    evidence: [
      "Runs quarterly partner and innovation events.",
      "Said their teams lose context after badge scans.",
      "Asked whether Lodestar can support a small event pilot.",
    ],
    opener:
      "You mentioned that badge scans create contacts but not enough context for teams to act—Lodestar is built around that exact gap.",
    questions: [
      "How does your team currently decide which event leads deserve follow-up?",
      "What would a useful pilot result look like after one event?",
    ],
  },
  {
    id: "aisha-rahman",
    initials: "AR",
    name: "Aisha Rahman",
    role: "Applied AI Engineer",
    company: "Independent",
    score: 79,
    opportunity: "Technical collaborator",
    reason:
      "Relevant OCR and agent-evaluation experience, with interest in short product collaborations.",
    nextAction: "Share the capture pipeline outline and ask for a technical review.",
    status: "This week",
    accent: "blue",
    tags: ["OCR", "Evaluation", "Builder"],
    evidence: [
      "Presented an OCR evaluation project at the event.",
      "Your note records interest in constrained agent workflows.",
      "No availability or commitment has been confirmed.",
    ],
    opener:
      "Your OCR evaluation work maps closely to the part of Lodestar where extraction confidence matters most.",
    questions: [
      "Which failure cases would you include in a first business-card OCR benchmark?",
      "Would you be open to reviewing a small evaluation set?",
    ],
  },
  {
    id: "daniel-koh",
    initials: "DK",
    name: "Daniel Koh",
    role: "Programme Director",
    company: "Foundry Asia",
    score: 74,
    opportunity: "Distribution partner",
    reason:
      "Runs founder events with repeat attendance and could validate an organiser-led distribution path.",
    nextAction: "Ask how organisers measure networking outcomes after an event.",
    status: "Explore",
    accent: "rose",
    tags: ["Events", "Community", "Distribution"],
    evidence: [
      "Programme page confirms recurring founder events.",
      "You met briefly; no product interest is confirmed yet.",
    ],
    opener:
      "I’m exploring how organisers can help attendees leave with clearer next actions, not just more contacts.",
    questions: [
      "How do you measure whether attendees made useful connections?",
      "Where does follow-through usually break after your events?",
    ],
  },
  {
    id: "mei-lin",
    initials: "ML",
    name: "Mei Lin",
    role: "Community Builder",
    company: "BuildSG",
    score: 68,
    opportunity: "Community partner",
    reason:
      "Strong network overlap, but the next step and direct product fit still need validation.",
    nextAction: "Reconnect with one focused question about member follow-up.",
    status: "Explore",
    accent: "violet",
    tags: ["Community", "Founder network"],
    evidence: [
      "Hosts a monthly builder meetup.",
      "No explicit buyer or partnership signal is recorded.",
    ],
    opener:
      "I liked your point that community value often shows up after the event, when the right introductions keep moving.",
    questions: [
      "What follow-up support do members ask for most often?",
      "Would ranked next actions feel useful or too prescriptive?",
    ],
  },
];

export const event = {
  name: "Singapore AI Builders Night",
  date: "27 Jun",
  venue: "One-North, Singapore",
  goal: "Find pilot customers, seed investors, and AI collaborators",
};

export const followUps = [
  {
    id: "sarah",
    contactId: "sarah-tan",
    name: "Sarah Tan",
    company: "Northstar Ventures",
    due: "Today",
    channel: "LinkedIn",
    draft:
      "Great meeting you at AI Builders Night. Your question about whether event organisers are the stronger initial buyer sharpened my thinking. I’m interviewing three organisers this week and would be glad to share what I learn.",
  },
  {
    id: "marcus",
    contactId: "marcus-lee",
    name: "Marcus Lee",
    company: "Asteria Group",
    due: "Tomorrow",
    channel: "Email",
    draft:
      "Marcus, I enjoyed our conversation about the context that gets lost after badge scans. I’d like to learn how your team handles post-event follow-up and show you a lightweight pilot flow. Would a 20-minute call next week work?",
  },
  {
    id: "aisha",
    contactId: "aisha-rahman",
    name: "Aisha Rahman",
    company: "Independent",
    due: "Fri, 30 Jun",
    channel: "Telegram",
    draft:
      "Your OCR evaluation demo stayed with me. I’m designing a small confidence-aware business-card capture flow for Lodestar and would value your view on the first failure cases to test. Can I send you the outline?",
  },
];
