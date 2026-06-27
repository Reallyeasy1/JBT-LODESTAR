import { Prisma } from "@prisma/client";
import { RankingOutput, RankingOutputSchema } from "@/ai/schemas/ranking.schema";
import { db } from "@/lib/db";
import { completeAgentRun, startAgentRun } from "@/services/agent-run.service";
import { rankContactRecords } from "@/services/ranking-score";

export type RankingEvidenceDetails = {
  signals: string[];
  scoreBreakdown: Record<string, number> | null;
};

export type RankedContactResult = {
  id: string;
  rankPosition: number;
  score: number | null;
  opportunityType: string | null;
  reasoning: string | null;
  nextAction: string | null;
  confidence: number | null;
  evidence: RankingEvidenceDetails;
  contact: {
    id: string;
    fullName: string | null;
    title: string | null;
    company: string | null;
    tags: string[];
  };
};

export type RankingDetail = {
  id: string;
  goalText: string;
  modelName: string | null;
  promptVersion: string | null;
  createdAt: Date;
  event: {
    id: string;
    name: string;
    location: string | null;
  } | null;
  items: RankedContactResult[];
};

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberRecord(value: unknown): Record<string, number> | null {
  if (!isRecord(value)) return null;
  const entries = Object.entries(value).filter((entry): entry is [string, number] => (
    typeof entry[1] === "number" && Number.isFinite(entry[1])
  ));
  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function parseRankingEvidence(value: Prisma.JsonValue | null): RankingEvidenceDetails {
  if (!isRecord(value)) return { signals: [], scoreBreakdown: null };
  return {
    signals: stringList(value.signals),
    scoreBreakdown: numberRecord(value.scoreBreakdown),
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
            contactId: contact.contactId,
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

export async function getRankingById(
  rankingId: string,
  userId: string,
): Promise<RankingDetail | null> {
  const ranking = await db.ranking.findFirst({
    where: { id: rankingId, userId },
    include: {
      event: {
        select: {
          id: true,
          name: true,
          location: true,
        },
      },
      items: {
        orderBy: { rankPosition: "asc" },
        include: {
          contact: {
            select: {
              id: true,
              fullName: true,
              title: true,
              company: true,
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
    goalText: ranking.goalText,
    modelName: ranking.modelName,
    promptVersion: ranking.promptVersion,
    createdAt: ranking.createdAt,
    event: ranking.event,
    items: ranking.items.map((item) => ({
      id: item.id,
      rankPosition: item.rankPosition,
      score: item.score,
      opportunityType: item.opportunityType,
      reasoning: item.reasoning,
      nextAction: item.nextAction,
      confidence: item.confidence,
      evidence: parseRankingEvidence(item.evidence),
      contact: {
        ...item.contact,
        tags: stringList(item.contact.tags),
      },
    })),
  };
}
