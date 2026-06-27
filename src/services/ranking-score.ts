import {
  ContactScoreBreakdownSchema,
  OpportunityType,
  RankedContact,
} from "@/ai/schemas/ranking.schema";

export type RankableContact = {
  id: string;
  fullName: string | null;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  languages: unknown;
  sourceType: string | null;
  sourceConfidence: number | null;
  tags: unknown;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type RankedDraft = Omit<RankedContact, "rank"> & {
  displayName: string;
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "backend",
  "for",
  "find",
  "in",
  "of",
  "one",
  "the",
  "to",
  "with",
]);

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function normalise(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(token: string): string {
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function tokens(value: string): Set<string> {
  return new Set(
    normalise(value)
      .split(" ")
      .map(stem)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

function contactText(contact: RankableContact): string {
  return [
    contact.title,
    contact.company,
    contact.notes,
    ...stringList(contact.tags),
  ]
    .filter(Boolean)
    .join(" ");
}

function opportunityTypeFor(contact: RankableContact): OpportunityType {
  const text = normalise(contactText(contact));

  if (/\b(investor|venture|vc|angel|fundraising|seed stage)\b/.test(text)) return "investor";
  if (/\b(recruiter|recruiting|talent acquisition)\b/.test(text)) return "recruiter";
  if (/\b(pilot customer|buyer|customer|enterprise tier|evaluation)\b/.test(text)) return "customer";
  if (/\b(engineer|developer|technical|cto|collaborator|integration|open source)\b/.test(text)) {
    return "collaborator";
  }
  if (/\b(mentor|advisor|adviser|coach)\b/.test(text)) return "mentor";
  if (/\b(candidate|hire|hiring)\b/.test(text)) return "hire";
  if (/\b(friend|community)\b/.test(text)) return "friend";

  return "other";
}

function goalOpportunityTypes(goal: string): Set<OpportunityType> {
  const text = normalise(goal);
  const types = new Set<OpportunityType>();

  if (/\b(investors?|investments?|fundraising|funds?|seed|capital|vc|angels?)\b/.test(text)) types.add("investor");
  if (/\b(customers?|pilots?|buyers?|enterprise|sales)\b/.test(text)) types.add("customer");
  if (/\b(collaborators?|collaboration|engineers?|developers?|technical|ai|backend|partners?)\b/.test(text)) {
    types.add("collaborator");
  }
  if (/\b(mentors?|advisors?|advisers?)\b/.test(text)) types.add("mentor");
  if (/\b(hires?|hiring|candidates?|team)\b/.test(text)) types.add("hire");
  if (/\b(recruiters?|recruiting)\b/.test(text)) types.add("recruiter");
  if (/\b(friend|community)\b/.test(text)) types.add("friend");

  return types;
}

function countOverlap(left: Set<string>, right: Set<string>): number {
  let count = 0;
  left.forEach((token) => {
    if (right.has(token)) count += 1;
  });
  return count;
}

function scoreGoalMatch(contact: RankableContact, goal: string, opportunityType: OpportunityType): number {
  const goalTypes = goalOpportunityTypes(goal);
  const categoryScore = goalTypes.has(opportunityType) ? 18 : goalTypes.size === 0 ? 8 : 2;
  const overlap = countOverlap(tokens(goal), tokens(contactText(contact)));
  return Math.min(25, categoryScore + Math.min(7, overlap * 2));
}

function scoreRoleRelevance(contact: RankableContact, goal: string, opportunityType: OpportunityType): number {
  const title = normalise(contact.title ?? "");
  const aligned = goalOpportunityTypes(goal).has(opportunityType);
  const seniorityBoost = /\b(managing partner|partner|chief|cto|ceo|head|vp|vice president|director)\b/.test(title)
    ? 3
    : /\b(senior|lead|manager)\b/.test(title)
      ? 2
      : 1;
  return Math.min(15, (aligned ? 11 : 2) + seniorityBoost);
}

function scoreDecisionInfluence(contact: RankableContact): number {
  const title = normalise(contact.title ?? "");
  if (/\b(managing partner|founder|chief|cto|ceo|cfo|coo|president)\b/.test(title)) return 15;
  if (/\b(partner|vp|vice president|head|director)\b/.test(title)) return 13;
  if (/\b(senior|lead|manager)\b/.test(title)) return 8;
  if (/\b(recruiter|engineer|developer|specialist)\b/.test(title)) return 4;
  return title ? 3 : 1;
}

function scoreCompanyIndustryFit(contact: RankableContact, goal: string, eventIndustry: string | null): number {
  const comparison = tokens(`${goal} ${eventIndustry ?? ""}`);
  const overlap = countOverlap(comparison, tokens(contactText(contact)));
  const explicitProductSignal = /\b(ai|startup|enterprise|pilot|venture|developer|infrastructure)\b/.test(
    normalise(contactText(contact)),
  );
  return Math.min(10, overlap * 2 + (explicitProductSignal ? 4 : 1));
}

function scoreSharedContext(contact: RankableContact): number {
  const tags = stringList(contact.tags);
  const languages = stringList(contact.languages);
  return Math.min(10, 2 + Math.min(5, tags.length * 2) + (languages.length > 0 ? 1 : 0));
}

function scoreFollowupClarity(contact: RankableContact): number {
  const notes = normalise(contact.notes ?? "");
  if (!notes) return 0;
  const strongSignals = notes.match(/\b(follow up|demo|send|share|connect|timeline|next week|q[1-4]|pilot)\b/g)?.length ?? 0;
  const interestSignals = notes.match(/\b(asked|open to|interested|looking for|could be|wants|values)\b/g)?.length ?? 0;
  return Math.min(10, 2 + strongSignals * 3 + interestSignals * 2);
}

function scoreReciprocity(contact: RankableContact): number {
  const notes = normalise(contact.notes ?? "");
  const signals = notes.match(/\b(asked|open to|interested|looking for|wants|values|mentioned)\b/g)?.length ?? 0;
  return Math.min(5, signals * 2);
}

function scoreFreshness(contact: RankableContact, now: Date): number {
  const ageInDays = Math.max(0, (now.getTime() - contact.updatedAt.getTime()) / 86_400_000);
  if (ageInDays <= 7) return 5;
  if (ageInDays <= 30) return 4;
  if (ageInDays <= 90) return 3;
  if (ageInDays <= 180) return 2;
  return 1;
}

function scoreEvidenceConfidence(contact: RankableContact): number {
  const populated = [
    contact.fullName,
    contact.title,
    contact.company,
    contact.email ?? contact.phone,
    contact.notes,
    contact.sourceType,
    stringList(contact.tags).length > 0,
    stringList(contact.languages).length > 0,
  ].filter(Boolean).length;
  return Math.min(5, Math.round((populated / 8) * 5));
}

function evidenceFor(contact: RankableContact, opportunityType: OpportunityType): string[] {
  const evidence = [
    contact.title && contact.company ? `${contact.title} at ${contact.company}` : contact.title ?? contact.company,
    stringList(contact.tags).length > 0 ? `Tags: ${stringList(contact.tags).join(", ")}` : null,
    contact.notes ? `Interaction note: ${contact.notes}` : null,
    contact.sourceConfidence != null
      ? `Capture confidence: ${Math.round(contact.sourceConfidence * 100)}%`
      : null,
    `Opportunity classification: ${opportunityType}`,
  ];
  return evidence.filter((item): item is string => Boolean(item));
}

function nextActionFor(contact: RankableContact): string {
  const notes = contact.notes ?? "";
  const noteSentences = notes.split(/(?<=[.!?])\s+/);
  const explicit = noteSentences.find((sentence) =>
    /follow up|demo|send|share|connect|asked|open to|pilot|timeline/i.test(sentence),
  );
  if (explicit) return explicit.replace(/\.$/, "");
  if (/possible duplicate|same company/i.test(notes)) return "Confirm whether this record is a duplicate before outreach";
  return "Add a specific interaction note before prioritising outreach";
}

function reasoningFor(
  contact: RankableContact,
  opportunityType: OpportunityType,
  breakdown: ReturnType<typeof ContactScoreBreakdownSchema.parse>,
): string {
  const name = contact.fullName ?? "This contact";
  const strongest = Object.entries(breakdown)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([dimension]) => dimension.replace(/([A-Z])/g, " $1").toLowerCase())
    .join(" and ");
  return `${name} is classified as a ${opportunityType} opportunity, led by ${strongest}.`;
}

export function scoreContactForGoal(
  contact: RankableContact,
  goal: string,
  eventIndustry: string | null,
  now = new Date(),
): RankedDraft {
  const opportunityType = opportunityTypeFor(contact);
  const scoreBreakdown = ContactScoreBreakdownSchema.parse({
    goalMatch: scoreGoalMatch(contact, goal, opportunityType),
    roleRelevance: scoreRoleRelevance(contact, goal, opportunityType),
    decisionInfluence: scoreDecisionInfluence(contact),
    companyIndustryFit: scoreCompanyIndustryFit(contact, goal, eventIndustry),
    sharedContext: scoreSharedContext(contact),
    followupClarity: scoreFollowupClarity(contact),
    reciprocity: scoreReciprocity(contact),
    freshness: scoreFreshness(contact, now),
    evidenceConfidence: scoreEvidenceConfidence(contact),
  });
  const score = Object.values(scoreBreakdown).reduce((total, value) => total + value, 0);
  const confidence = Math.min(100, 45 + scoreBreakdown.evidenceConfidence * 10 + scoreBreakdown.followupClarity * 2);

  return {
    displayName: contact.fullName ?? "Unnamed contact",
    contactId: contact.id,
    score,
    scoreBreakdown,
    opportunityType,
    reasoning: reasoningFor(contact, opportunityType, scoreBreakdown),
    nextAction: nextActionFor(contact),
    confidence,
    evidence: evidenceFor(contact, opportunityType),
  };
}

export function rankContactRecords(
  contacts: RankableContact[],
  goal: string,
  eventIndustry: string | null,
  now = new Date(),
): RankedContact[] {
  return contacts
    .map((contact) => scoreContactForGoal(contact, goal, eventIndustry, now))
    .sort((left, right) => right.score - left.score || left.displayName.localeCompare(right.displayName))
    .map((contact, index) => ({
      contactId: contact.contactId,
      rank: index + 1,
      score: contact.score,
      scoreBreakdown: contact.scoreBreakdown,
      opportunityType: contact.opportunityType,
      reasoning: contact.reasoning,
      nextAction: contact.nextAction,
      confidence: contact.confidence,
      evidence: contact.evidence,
    }));
}
