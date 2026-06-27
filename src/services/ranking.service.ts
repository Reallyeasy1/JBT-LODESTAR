import { Prisma } from "@prisma/client";
import {
  ContactScoreBreakdown,
  ContactScoreBreakdownSchema,
  RankingOutput,
  RankingOutputSchema,
} from "@/ai/schemas/ranking.schema";
import { db } from "@/lib/db";
import { completeAgentRun, startAgentRun } from "@/services/agent-run.service";
import { rankContactRecords } from "@/services/ranking-score";

export type RankingDetailItem = {
  id: string;
  contactId: string;
  rankPosition: number;
  score: number | null;
  opportunityType: string | null;
  reasoning: string | null;
  nextAction: string | null;
  confidence: number | null;
  evidence: string[];
  scoreBreakdown: ContactScoreBreakdown | null;
  contact: {
    id: string;
    fullName: string | null;
    title: string | null;
    company: string | null;
    email: string | null;
    sourceConfidence: number | null;
    tags: string[];
  };
};

export type RankingDetail = {
  id: string;
  eventId: string | null;
  eventName: string | null;
  goalText: string;
  modelName: string | null;
  promptVersion: string | null;
  createdAt: Date;
  items: RankingDetailItem[];
};

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function evidencePayload(value: unknown): {
  signals: string[];
  scoreBreakdown: ContactScoreBreakdown | null;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { signals: [], scoreBreakdown: null };
  }

  const record = value as Record<string, unknown>;
  const parsedBreakdown = ContactScoreBreakdownSchema.safeParse(record.scoreBreakdown);

  return {
    signals: stringList(record.signals),
    scoreBreakdown: parsedBreakdown.success ? parsedBreakdown.data : null,
  };
}

export async function getRankingById(
  rankingId: string,
  userId: string,
): Promise<RankingDetail | null> {
  const ranking = await db.ranking.findFirst({
    where: { id: rankingId, userId },
    include: {
      event: { select: { id: true, name: true } },
      items: {
        orderBy: [{ rankPosition: "asc" }, { createdAt: "asc" }],
        include: {
          contact: {
            select: {
              id: true,
              fullName: true,
              title: true,
              company: true,
              email: true,
              sourceConfidence: true,
              tags: true,
            },
          },
        },
      },
    },
  });

  if (!ranking) return null;

  return {
    id: ranking.id,
    eventId: ranking.eventId,
    eventName: ranking.event?.name ?? null,
    goalText: ranking.goalText,
    modelName: ranking.modelName,
    promptVersion: ranking.promptVersion,
    createdAt: ranking.createdAt,
    items: ranking.items.map((item) => {
      const evidence = evidencePayload(item.evidence);
      return {
        id: item.id,
        contactId: item.contactId,
        rankPosition: item.rankPosition,
        score: item.score,
        opportunityType: item.opportunityType,
        reasoning: item.reasoning,
        nextAction: item.nextAction,
        confidence: item.confidence,
        evidence: evidence.signals,
        scoreBreakdown: evidence.scoreBreakdown,
        contact: {
          ...item.contact,
          tags: stringList(item.contact.tags),
        },
      };
    }),
  };
}

export async function rankContacts(
  eventId: string,
  requestedGoal: string | undefined,
  userId: string,
): Promise<RankingOutput> {
  const startedAt = Date.now();
  const agentRunId = await startAgentRun({
    userId,
    taskType: "rank_contacts",
    agentType: "deterministic-ranking",
    modelName: "deterministic-v1",
    promptVersion: "ranking-v1",
    inputJson: { eventId, requestedGoal },
  });

  try {
    const event = await db.event.findFirst({
      where: { id: eventId, userId },
      include: { contacts: true },
    });

    if (!event) throw new Error("Event not found");

    const goal = requestedGoal?.trim() || event.eventGoal?.trim();
    if (!goal) throw new Error("A networking goal is required to rank contacts");
    if (event.contacts.length === 0) throw new Error("The event has no contacts to rank");

    const rankedContacts = rankContactRecords(event.contacts, goal, event.industry);
    const validated = RankingOutputSchema.parse({
      eventId,
      goal,
      rankedContacts,
    });

    const ranking = await db.ranking.create({
      data: {
        userId,
        eventId,
        goalText: validated.goal,
        modelName: "deterministic-v1",
        promptVersion: "ranking-v1",
        items: {
          create: validated.rankedContacts.map((contact) => ({
            contact: { connect: { id: contact.contactId } },
            rankPosition: contact.rank,
            score: contact.score,
            opportunityType: contact.opportunityType,
            reasoning: contact.reasoning,
            nextAction: contact.nextAction,
            confidence: contact.confidence,
            evidence: {
              signals: contact.evidence,
              scoreBreakdown: contact.scoreBreakdown,
            } as Prisma.InputJsonValue,
          })),
        },
      },
    });

    const output = RankingOutputSchema.parse({ ...validated, rankingId: ranking.id });
    await completeAgentRun(agentRunId, {
      outputJson: output,
      status: "success",
      latencyMs: Date.now() - startedAt,
      tokenInput: 0,
      tokenOutput: 0,
    });
    return output;
  } catch (error) {
    await completeAgentRun(agentRunId, {
      outputJson: null,
      status: "error",
      latencyMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Unknown ranking error",
    }).catch(() => undefined);
    throw error;
  }
}
