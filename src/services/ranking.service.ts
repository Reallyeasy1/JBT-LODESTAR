import { Prisma } from "@prisma/client";
import { RankingOutput, RankingOutputSchema } from "@/ai/schemas/ranking.schema";
import { db } from "@/lib/db";
import { completeAgentRun, startAgentRun } from "@/services/agent-run.service";
import { rankContactRecords } from "@/services/ranking-score";

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
