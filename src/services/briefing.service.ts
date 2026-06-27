import { Prisma } from "@prisma/client";
import { generateStructuredOutput } from "@/ai/client";
import { BRIEFING_PROMPT_VERSION, briefingSystemPrompt } from "@/ai/prompts/briefing";
import { BriefingOutputSchema, type BriefingOutput } from "@/ai/schemas/briefing.schema";
import { db } from "@/lib/db";
import { completeAgentRun, startAgentRun } from "@/services/agent-run.service";
import { checkOutput } from "@/services/verification.service";

export async function generateBriefing(contactId: string, userId: string) {
  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
    include: {
      event: true,
      user: {
        include: { profile: true },
      },
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  const startedAt = Date.now();
  const inputJson = {
    prompt: briefingSystemPrompt,
    contact: {
      id: contact.id,
      fullName: contact.fullName,
      title: contact.title,
      company: contact.company,
      languages: contact.languages,
      notes: contact.notes,
      tags: contact.tags,
      sourceConfidence: contact.sourceConfidence,
    },
    event: contact.event
      ? {
          id: contact.event.id,
          name: contact.event.name,
          industry: contact.event.industry,
          eventGoal: contact.event.eventGoal,
        }
      : null,
    userProfile: contact.user.profile
      ? {
          displayName: contact.user.profile.displayName,
          title: contact.user.profile.title,
          company: contact.user.profile.company,
          networkingGoals: contact.user.profile.networkingGoals,
          preferredTone: contact.user.profile.preferredTone,
        }
      : null,
  };

  const agentRunId = await startAgentRun({
    userId,
    taskType: "briefing",
    agentType: "ai-workflow-engineer",
    modelName: "mock-lodestar",
    promptVersion: BRIEFING_PROMPT_VERSION,
    inputJson,
  });

  try {
    const aiResponse = await generateStructuredOutput<BriefingOutput>({
      task: "briefing",
      input: inputJson,
    });
    const parsed = BriefingOutputSchema.parse(aiResponse.output);
    const verification = checkOutput(parsed, "briefing");

    if (verification.blockers.length > 0) {
      throw new Error(verification.blockers.join("; "));
    }

    const finalOutput = BriefingOutputSchema.parse({
      ...parsed,
      warnings: mergeWarnings(parsed.warnings, verification.warnings),
      confidenceScore:
        verification.warnings.length > 0 ? Math.max(0, parsed.confidenceScore - 15) : parsed.confidenceScore,
    });

    const briefing = await db.briefing.create({
      data: {
        userId,
        contactId: contact.id,
        agentRunId,
        personSummary: finalOutput.personSummary,
        whyTheyMatter: finalOutput.whyTheyMatter,
        likelyGoal: finalOutput.likelyGoal,
        decisionAuthority: finalOutput.decisionAuthority,
        talkingPoints: finalOutput.talkingPoints as Prisma.InputJsonValue,
        questionsToAsk: finalOutput.questionsToAsk as Prisma.InputJsonValue,
        culturalNotes: finalOutput.culturalNotes as Prisma.InputJsonValue,
        warnings: finalOutput.warnings as Prisma.InputJsonValue,
        confidenceScore: finalOutput.confidenceScore,
      },
    });

    await completeAgentRun(agentRunId, {
      outputJson: finalOutput,
      status: "success",
      latencyMs: Date.now() - startedAt,
      tokenInput: aiResponse.tokenInput,
      tokenOutput: aiResponse.tokenOutput,
    });

    return briefing;
  } catch (error) {
    await completeAgentRun(agentRunId, {
      outputJson: {},
      status: "error",
      latencyMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Unknown briefing generation error",
    });
    throw error;
  }
}

function mergeWarnings(existing: string[], generated: string[]): string[] {
  return Array.from(new Set([...existing, ...generated]));
}
