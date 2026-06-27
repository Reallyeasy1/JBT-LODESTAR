import { Prisma } from "@prisma/client";
import { getLLMClient } from "@/ai/client";
import { createMockBriefing } from "@/ai/mocks/briefing";
import {
  BRIEFING_SYSTEM_PROMPT,
  BriefingPromptInput,
  buildBriefingPrompt,
} from "@/ai/prompts/briefing";
import { BriefingOutput, BriefingOutputSchema } from "@/ai/schemas/briefing.schema";
import { db } from "@/lib/db";
import { completeAgentRun, startAgentRun } from "@/services/agent-run.service";
import { checkOutput } from "@/services/verification.service";

export type BriefingDetail = {
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

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function toBriefingDetail(briefing: {
  id: string;
  personSummary: string | null;
  whyTheyMatter: string | null;
  likelyGoal: string | null;
  decisionAuthority: string | null;
  talkingPoints: Prisma.JsonValue | null;
  questionsToAsk: Prisma.JsonValue | null;
  culturalNotes: Prisma.JsonValue | null;
  warnings: Prisma.JsonValue | null;
  confidenceScore: number | null;
  createdAt: Date;
}): BriefingDetail {
  return {
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
  };
}

export async function getLatestBriefingForContact(
  contactId: string,
  userId: string,
): Promise<BriefingDetail | null> {
  const contact = await db.contact.findFirst({
    where: { id: contactId, userId },
    select: { id: true },
  });
  if (!contact) throw new Error("Contact not found");

  const briefing = await db.briefing.findFirst({
    where: { contactId, userId },
    orderBy: { createdAt: "desc" },
  });
  return briefing ? toBriefingDetail(briefing) : null;
}

export async function generateBriefing(contactId: string, userId: string): Promise<BriefingOutput> {
  const startedAt = Date.now();
  const agentRunId = await startAgentRun({
    userId,
    taskType: "generate_briefing",
    agentType: "briefing",
    modelName: "mock-v1",
    promptVersion: "briefing-v1",
    inputJson: { contactId },
  });

  try {
    const contact = await db.contact.findFirst({
      where: { id: contactId, userId },
      include: {
        event: true,
        user: { include: { profile: true } },
      },
    });
    if (!contact) throw new Error("Contact not found");

    const promptInput: BriefingPromptInput = {
      contact: {
        fullName: contact.fullName,
        title: contact.title,
        company: contact.company,
        languages: stringList(contact.languages),
        tags: stringList(contact.tags),
        notes: contact.notes,
      },
      event: {
        name: contact.event?.name ?? null,
        goal: contact.event?.eventGoal ?? null,
        industry: contact.event?.industry ?? null,
      },
      user: {
        title: contact.user.profile?.title ?? null,
        company: contact.user.profile?.company ?? null,
        preferredTone: contact.user.profile?.preferredTone ?? null,
      },
    };
    const prompt = buildBriefingPrompt(promptInput);
    const generation = await getLLMClient().generate({
      prompt,
      systemPrompt: BRIEFING_SYSTEM_PROMPT,
      schema: BriefingOutputSchema,
      mockOutput: createMockBriefing(promptInput),
      modelName: "mock-v1",
    });
    const verification = checkOutput(generation.output, "briefing");
    const verified = BriefingOutputSchema.parse({
      ...generation.output,
      warnings: [
        ...generation.output.warnings,
        ...verification.warnings,
        ...verification.blockers.map((blocker) => `BLOCKED: ${blocker}`),
      ],
      confidenceScore: Math.max(
        0,
        generation.output.confidenceScore - verification.warnings.length * 5 - verification.blockers.length * 20,
      ),
    });

    const briefing = await db.briefing.create({
      data: {
        userId,
        contactId,
        agentRunId,
        personSummary: verified.personSummary,
        whyTheyMatter: verified.whyTheyMatter,
        likelyGoal: verified.likelyGoal,
        decisionAuthority: verified.decisionAuthority,
        talkingPoints: verified.talkingPoints as Prisma.InputJsonValue,
        questionsToAsk: verified.questionsToAsk as Prisma.InputJsonValue,
        culturalNotes: verified.culturalNotes as Prisma.InputJsonValue,
        warnings: verified.warnings as Prisma.InputJsonValue,
        confidenceScore: verified.confidenceScore,
      },
    });
    const output = BriefingOutputSchema.parse({ ...verified, briefingId: briefing.id });
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
      errorMessage: error instanceof Error ? error.message : "Unknown briefing error",
    }).catch(() => undefined);
    throw error;
  }
}
