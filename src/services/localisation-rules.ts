import { LocalisationOutput, LocalisationOutputSchema } from "@/ai/schemas/localisation.schema";
import { checkOutput } from "@/services/verification.service";

export function stringList(value: unknown): string[] {
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
