import { db } from "@/lib/db";

export type ContactListRecord = {
  id: string;
  fullName: string | null;
  title: string | null;
  company: string | null;
  sourceType: string | null;
  sourceConfidence: number | null;
  tags: string[];
};

export type ContactBriefingRecord = {
  id: string;
  personSummary: string | null;
  whyTheyMatter: string | null;
  likelyGoal: string | null;
  decisionAuthority: string | null;
  talkingPoints: string[];
  questionsToAsk: string[];
  culturalNotes: string[];
  warnings: string[];
  confidenceScore: number | null;
  createdAt: Date;
};

export type ContactLocalisationRecord = {
  id: string;
  openerText: string | null;
  languageUsed: string | null;
  confidenceScore: number | null;
  warnings: string[];
  createdAt: Date;
};

export type ContactFollowUpRecord = {
  id: string;
  subject: string | null;
  draftText: string | null;
  status: string;
  recommendedTiming: string | null;
  userApproved: boolean;
  createdAt: Date;
};

export type ContactInteractionRecord = {
  id: string;
  interactionTime: Date;
  meetingContext: string | null;
  userNotes: string | null;
  aiSummary: string | null;
  nextAction: string | null;
  outcome: string | null;
};

export type ContactDetail = ContactListRecord & {
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  languages: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  event: {
    id: string;
    name: string;
    location: string | null;
    eventGoal: string | null;
  } | null;
  latestBriefing: ContactBriefingRecord | null;
  latestLocalisation: ContactLocalisationRecord | null;
  latestFollowUp: ContactFollowUpRecord | null;
  recentInteractions: ContactInteractionRecord[];
};

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function latest<T>(items: T[]): T | null {
  return items[0] ?? null;
}

export async function listContactsForEvent(
  eventId: string,
  userId: string,
): Promise<ContactListRecord[]> {
  const contacts = await db.contact.findMany({
    where: { eventId, userId },
    orderBy: [{ createdAt: "asc" }, { fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      title: true,
      company: true,
      sourceType: true,
      sourceConfidence: true,
      tags: true,
    },
  });
  return contacts.map((contact) => ({ ...contact, tags: stringList(contact.tags) }));
}

export async function getContactById(
  contactId: string,
  userId: string,
): Promise<ContactDetail | null> {
  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          location: true,
          eventGoal: true,
        },
      },
      briefings: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      localisations: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      followUps: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      interactions: {
        orderBy: { interactionTime: "desc" },
        take: 5,
      },
    },
  });

  if (!contact) return null;

  const briefing = latest(contact.briefings);
  const localisation = latest(contact.localisations);
  const followUp = latest(contact.followUps);

  return {
    id: contact.id,
    fullName: contact.fullName,
    title: contact.title,
    company: contact.company,
    email: contact.email,
    phone: contact.phone,
    linkedinUrl: contact.linkedinUrl,
    websiteUrl: contact.websiteUrl,
    languages: stringList(contact.languages),
    sourceType: contact.sourceType,
    sourceConfidence: contact.sourceConfidence,
    tags: stringList(contact.tags),
    notes: contact.notes,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
    event: contact.event,
    latestBriefing: briefing
      ? {
          id: briefing.id,
          personSummary: briefing.personSummary,
          whyTheyMatter: briefing.whyTheyMatter,
          likelyGoal: briefing.likelyGoal,
          decisionAuthority: briefing.decisionAuthority,
          talkingPoints: stringList(briefing.talkingPoints),
          questionsToAsk: stringList(briefing.questionsToAsk),
          culturalNotes: stringList(briefing.culturalNotes),
          warnings: stringList(briefing.warnings),
          confidenceScore: briefing.confidenceScore,
          createdAt: briefing.createdAt,
        }
      : null,
    latestLocalisation: localisation
      ? {
          id: localisation.id,
          openerText: localisation.openerText,
          languageUsed: localisation.languageUsed,
          confidenceScore: localisation.confidenceScore,
          warnings: stringList(localisation.warnings),
          createdAt: localisation.createdAt,
        }
      : null,
    latestFollowUp: followUp
      ? {
          id: followUp.id,
          subject: followUp.subject,
          draftText: followUp.draftText,
          status: followUp.status,
          recommendedTiming: followUp.recommendedTiming,
          userApproved: followUp.userApproved,
          createdAt: followUp.createdAt,
        }
      : null,
    recentInteractions: contact.interactions.map((interaction) => ({
      id: interaction.id,
      interactionTime: interaction.interactionTime,
      meetingContext: interaction.meetingContext,
      userNotes: interaction.userNotes,
      aiSummary: interaction.aiSummary,
      nextAction: interaction.nextAction,
      outcome: interaction.outcome,
    })),
  };
}
