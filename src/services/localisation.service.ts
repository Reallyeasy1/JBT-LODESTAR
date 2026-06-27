import { Prisma } from "@prisma/client";
import { getLLMClient } from "@/ai/client";
import { createMockLocalisation } from "@/ai/mocks/localisation";
import {
  LOCALISATION_SYSTEM_PROMPT,
  LocalisationPromptInput,
  buildLocalisationPrompt,
} from "@/ai/prompts/localisation";
import {
  LocalisationOutput,
  LocalisationOutputSchema,
} from "@/ai/schemas/localisation.schema";
import { db } from "@/lib/db";
import { completeAgentRun, startAgentRun } from "@/services/agent-run.service";
import { checkOutput } from "@/services/verification.service";

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export function selectStatedLanguage(languages: string[], requestedLanguage?: string): string {
  if (languages.length === 0) throw new Error("Contact has no stated language preference");
  if (!requestedLanguage?.trim()) return languages[0];
  const selected = languages.find(
    (language) => language.toLowerCase() === requestedLanguage.trim().toLowerCase(),
  );
  if (!selected) throw new Error("Requested language is not listed in the contact profile");
  return selected;
}

export function applyLocalisationVerification(output: LocalisationOutput): LocalisationOutput {
  const verification = checkOutput(output, "localisation");
  return LocalisationOutputSchema.parse({
    ...output,
    warnings: [
      ...output.warnings,
      ...verification.warnings,
      ...verification.blockers.map((blocker) => `BLOCKED: ${blocker}`),
    ],
    confidenceScore: Math.max(
      0,
      output.confidenceScore - verification.warnings.length * 5 - verification.blockers.length * 25,
    ),
  });
}

export async function generateLocalisation(
  contactId: string,
  requestedLanguage: string | undefined,
  userId: string,
): Promise<LocalisationOutput> {
  const startedAt = Date.now();
  const agentRunId = await startAgentRun({
    userId,
    taskType: "generate_localisation",
    agentType: "localisation",
    modelName: "mock-v1",
    promptVersion: "localisation-v1",
    inputJson: { contactId, requestedLanguage },
  });

  try {
    const contact = await db.contact.findFirst({
      where: { id: contactId, userId },
      include: { user: { include: { profile: true } } },
    });
    if (!contact) throw new Error("Contact not found");

    const statedLanguages = stringList(contact.languages);
    const selectedLanguage = selectStatedLanguage(statedLanguages, requestedLanguage);
    const promptInput: LocalisationPromptInput = {
      contact: {
        fullName: contact.fullName,
        statedLanguages,
      },
      user: {
        displayName: contact.user.profile?.displayName ?? contact.user.name,
        company: contact.user.profile?.company ?? null,
      },
      selectedLanguage,
    };
    const generation = await getLLMClient().generate({
      prompt: buildLocalisationPrompt(promptInput),
      systemPrompt: LOCALISATION_SYSTEM_PROMPT,
      schema: LocalisationOutputSchema,
      mockOutput: createMockLocalisation(promptInput),
      modelName: "mock-v1",
    });
    const verified = applyLocalisationVerification(generation.output);

    const localisation = await db.localisation.create({
      data: {
        userId,
        contactId,
        agentRunId,
        openerText: verified.openerText,
        languageUsed: verified.languageUsed,
        confidenceScore: verified.confidenceScore,
        warnings: verified.warnings as Prisma.InputJsonValue,
      },
    });
    const output = LocalisationOutputSchema.parse({ ...verified, localisationId: localisation.id });
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
      errorMessage: error instanceof Error ? error.message : "Unknown localisation error",
    }).catch(() => undefined);
    throw error;
  }
}
