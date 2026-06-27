import { z } from "zod";
import { getLLMClient } from "@/ai/client";
import { createMockFollowUp } from "@/ai/mocks/followup";
import {
  FOLLOWUP_SYSTEM_PROMPT,
  FollowUpPromptInput,
  buildFollowUpPrompt,
} from "@/ai/prompts/followup";
import { FollowUpOutput, FollowUpOutputSchema } from "@/ai/schemas/followup.schema";
import { db } from "@/lib/db";
import { completeAgentRun, startAgentRun } from "@/services/agent-run.service";
import { checkOutput } from "@/services/verification.service";

export type FollowUpDetail = {
  id: string;
  contactId: string;
  interactionId: string | null;
  subject: string | null;
  draftText: string | null;
  status: string;
  recommendedTiming: string | null;
  userApproved: boolean;
  sentAt: Date | null;
  createdAt: Date;
};

export async function getFollowUpById(
  followUpId: string,
  userId: string,
): Promise<FollowUpDetail | null> {
  const followUp = await db.followUp.findFirst({
    where: { id: followUpId, userId },
    select: {
      id: true,
      contactId: true,
      interactionId: true,
      subject: true,
      draftText: true,
      status: true,
      recommendedTiming: true,
      userApproved: true,
      sentAt: true,
      createdAt: true,
    },
  });
  return followUp ?? null;
}

const UserReviewInvariantSchema = z.object({
  requiresUserReview: z.literal(true),
});

export type GenerateFollowUpInput = {
  contactId: string;
  interactionId?: string;
  meetingNote: string;
};

export async function generateFollowUp(
  input: GenerateFollowUpInput,
  userId: string,
): Promise<FollowUpOutput> {
  const startedAt = Date.now();
  const agentRunId = await startAgentRun({
    userId,
    taskType: "generate_followup",
    agentType: "followup",
    modelName: "mock-v1",
    promptVersion: "followup-v1",
    inputJson: input,
  });

  try {
    const contact = await db.contact.findFirst({
      where: { id: input.contactId, userId },
      include: { user: { include: { profile: true } } },
    });
    if (!contact) throw new Error("Contact not found");

    if (input.interactionId) {
      const interaction = await db.interaction.findFirst({
        where: { id: input.interactionId, contactId: input.contactId, userId },
        select: { id: true },
      });
      if (!interaction) throw new Error("Interaction not found");
    }

    const promptInput: FollowUpPromptInput = {
      contact: {
        fullName: contact.fullName,
        title: contact.title,
        company: contact.company,
      },
      user: {
        displayName: contact.user.profile?.displayName ?? contact.user.name,
        title: contact.user.profile?.title ?? null,
        company: contact.user.profile?.company ?? null,
        preferredTone: contact.user.profile?.preferredTone ?? null,
      },
      meetingNote: input.meetingNote.trim(),
    };
    const generation = await getLLMClient().generate({
      prompt: buildFollowUpPrompt(promptInput),
      systemPrompt: FOLLOWUP_SYSTEM_PROMPT,
      schema: FollowUpOutputSchema,
      mockOutput: createMockFollowUp(promptInput),
      modelName: "mock-v1",
    });

    UserReviewInvariantSchema.parse(generation.output);
    const verification = checkOutput(generation.output, "followup");
    if (verification.blockers.length > 0) {
      throw new Error(`Follow-up failed verification: ${verification.blockers.join(" ")}`);
    }
    const verified = FollowUpOutputSchema.parse({
      ...generation.output,
      warnings: [...(generation.output.warnings ?? []), ...verification.warnings],
      confidence: Math.max(0, generation.output.confidence - verification.warnings.length * 5),
      requiresUserReview: true,
    });

    const followUp = await db.followUp.create({
      data: {
        userId,
        contactId: input.contactId,
        interactionId: input.interactionId,
        subject: verified.subject,
        draftText: verified.draftText,
        status: "drafted",
        recommendedTiming: verified.recommendedTiming,
        userApproved: false,
        sentAt: null,
      },
    });
    const output = FollowUpOutputSchema.parse({ ...verified, followUpId: followUp.id });
    await completeAgentRun(agentRunId, {
      outputJson: output,
      status: "success",
      latencyMs: Date.now() - startedAt,
      tokenInput: generation.tokenInput,
      tokenOutput: generation.tokenOutput,
    });
    return output;
  } catch (error) {
    await completeAgentRun(agentRunId, {
      outputJson: null,
      status: "error",
      latencyMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message : "Unknown follow-up error",
    }).catch(() => undefined);
    throw error;
  }
}
