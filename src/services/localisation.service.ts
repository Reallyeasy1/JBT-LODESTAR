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

export function enforceSelectedLanguage(
  output: LocalisationOutput,
  selectedLanguage: string,
): LocalisationOutput {
  if (output.languageUsed.trim().toLowerCase() !== selectedLanguage.trim().toLowerCase()) {
    throw new Error("Generated localisation language did not match the selected contact language");
  }

  return LocalisationOutputSchema.parse({
    ...output,
    languageUsed: selectedLanguage,
  });
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
    const languageChecked = enforceSelectedLanguage(generation.output, selectedLanguage);
    const verified = applyLocalisationVerification(languageChecked);

    const output = await db.$transaction(async (tx) => {
      const localisation = await tx.localisation.create({
        data: {
          userId,
          contactId,
          agentRunId,
          openerText: verified.openerText,
          languageUsed: selectedLanguage,
          confidenceScore: verified.confidenceScore,
          warnings: verified.warnings as Prisma.InputJsonValue,
        },
      });
      const completedOutput = LocalisationOutputSchema.parse({
        ...verified,
        languageUsed: selectedLanguage,
        localisationId: localisation.id,
      });
      await tx.agentRun.update({
        where: { id: agentRunId },
        data: {
          outputJson: completedOutput as Prisma.InputJsonValue,
          status: "success",
          latencyMs: Date.now() - startedAt,
          tokenInput: generation.tokenInput,
          tokenOutput: generation.tokenOutput,
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
      errorMessage: error instanceof Error ? error.message : "Unknown localisation error",
    }).catch(() => undefined);
    throw error;
  }
}
