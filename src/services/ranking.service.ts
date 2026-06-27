import { Prisma } from "@prisma/client";
import { RankingOutput, RankingOutputSchema } from "@/ai/schemas/ranking.schema";
import { db } from "@/lib/db";
import { completeAgentRun, startAgentRun } from "@/services/agent-run.service";
import { rankContactRecords } from "@/services/ranking-score";

type RankingErrorStatus = 400 | 404 | 422;

export class RankingServiceError extends Error {
  readonly status: RankingErrorStatus;

  constructor(message: string, status: RankingErrorStatus) {
    super(message);
    this.name = "RankingServiceError";
    this.status = status;
  }
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

    if (!event) throw new RankingServiceError("Event not found", 404);

    const goal = requestedGoal?.trim() || event.eventGoal?.trim();
    if (!goal) throw new RankingServiceError("A networking goal is required to rank contacts", 422);
    if (event.contacts.length === 0) {
      throw new RankingServiceError("The event has no contacts to rank", 422);
    }

    const rankedContacts = rankContactRecords(event.contacts, goal, event.industry);
    const validated = RankingOutputSchema.parse({
      eventId,
      goal,
      rankedContacts,
    });

    const output = await db.$transaction(async (tx) => {
      const ranking = await tx.ranking.create({
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

      const completedOutput = RankingOutputSchema.parse({ ...validated, rankingId: ranking.id });
      await tx.agentRun.update({
        where: { id: agentRunId },
        data: {
          outputJson: completedOutput as Prisma.InputJsonValue,
          status: "success",
          latencyMs: Date.now() - startedAt,
          tokenInput: 0,
          tokenOutput: 0,
          errorMessage: null,
        },
      });

      return completedOutput;
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
