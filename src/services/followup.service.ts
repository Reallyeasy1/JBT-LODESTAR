import type { FollowUp } from "@prisma/client";
import { generateStructuredOutput } from "@/ai/client";
import { FOLLOWUP_PROMPT_VERSION, followUpSystemPrompt } from "@/ai/prompts/followup";
import { FollowUpOutputSchema, type FollowUpOutput } from "@/ai/schemas/followup.schema";
import { db } from "@/lib/db";
import { completeAgentRun, startAgentRun } from "@/services/agent-run.service";
import { checkOutput } from "@/services/verification.service";

type GenerateFollowUpParams = {
  contactId: string;
  userId: string;
  interactionId?: string;
  meetingNote?: string;
};

export type GenerateFollowUpResult = {
  followUp: FollowUp;
  output: FollowUpOutput;
};

export async function generateFollowUp(params: GenerateFollowUpParams): Promise<GenerateFollowUpResult> {
  const contact = await db.contact.findFirst({
    where: { id: params.contactId, userId: params.userId },
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

  const interaction = await resolveInteraction(params, contact.eventId);
  const startedAt = Date.now();
  const inputJson = {
    prompt: followUpSystemPrompt,
    contact: {
      id: contact.id,
      fullName: contact.fullName,
      title: contact.title,
      company: contact.company,
      notes: contact.notes,
    },
    event: contact.event
      ? {
          id: contact.event.id,
          name: contact.event.name,
          eventGoal: contact.event.eventGoal,
        }
      : null,
    interaction: interaction
      ? {
          id: interaction.id,
          userNotes: interaction.userNotes,
          meetingContext: interaction.meetingContext,
          nextAction: interaction.nextAction,
        }
      : { userNotes: params.meetingNote ?? "" },
    userProfile: contact.user.profile
      ? {
          displayName: contact.user.profile.displayName,
          title: contact.user.profile.title,
          company: contact.user.profile.company,
          preferredTone: contact.user.profile.preferredTone,
        }
      : null,
  };

  const agentRunId = await startAgentRun({
    userId: params.userId,
    taskType: "followup",
    agentType: "ai-workflow-engineer",
    modelName: "mock-lodestar",
    promptVersion: FOLLOWUP_PROMPT_VERSION,
    inputJson,
  });

  try {
    const aiResponse = await generateStructuredOutput<FollowUpOutput>({
      task: "followup",
      input: inputJson,
    });
    const finalOutput = FollowUpOutputSchema.parse(aiResponse.output);
    const verification = checkOutput(finalOutput, "followup");

    if (verification.blockers.length > 0) {
      throw new Error(verification.blockers.join("; "));
    }

    const followUp = await db.followUp.create({
      data: {
        userId: params.userId,
        contactId: contact.id,
        interactionId: interaction?.id,
        subject: finalOutput.subject,
        draftText: finalOutput.draftText,
        recommendedTiming: finalOutput.recommendedTiming,
        status: "drafted",
        userApproved: false,
      },
    });

    await completeAgentRun(agentRunId, {
      outputJson: finalOutput,
      status: "success",
      latencyMs: Date.now() - startedAt,
      tokenInput: aiResponse.tokenInput,
      tokenOutput: aiResponse.tokenOutput,
    });

    return { followUp, output: finalOutput };
  } catch (error) {
    await completeAgentRun(agentRunId, {
      outputJson: {},
      status: "error",
      latencyMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Unknown follow-up generation error",
    });
    throw error;
  }
}

async function resolveInteraction(params: GenerateFollowUpParams, eventId: string | null) {
  if (params.interactionId) {
    const interaction = await db.interaction.findFirst({
      where: {
        id: params.interactionId,
        userId: params.userId,
        contactId: params.contactId,
      },
    });

    if (!interaction) {
      throw new Error("Interaction not found");
    }

    return interaction;
  }

  const note = params.meetingNote?.trim();
  if (!note) return null;

  return db.interaction.create({
    data: {
      userId: params.userId,
      contactId: params.contactId,
      eventId,
      userNotes: note,
    },
  });
}
