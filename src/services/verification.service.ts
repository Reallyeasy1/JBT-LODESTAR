export type VerificationType = "briefing" | "ranking" | "followup" | "localisation";

export type VerificationResult = {
  warnings: string[];
  blockers: string[];
};

const NATIONALITY_PEOPLE_PATTERN =
  /\b(?:american|australian|british|chinese|filipino|french|german|indian|indonesian|japanese|korean|malaysian|singaporean|thai|vietnamese) people\b/i;

function collectStrings(value: unknown, result: string[] = []): string[] {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, result));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, result));
  }
  return result;
}

export function checkOutput(output: unknown, _type: VerificationType): VerificationResult {
  void _type;
  const text = collectStrings(output).join(" \n ");
  const warnings = new Set<string>();
  const blockers = new Set<string>();

  if (/\bbecause they are\s+[a-z-]+/i.test(text) || NATIONALITY_PEOPLE_PATTERN.test(text)) {
    blockers.add("Possible cultural stereotype: ground advice in an explicitly stated individual preference.");
  }
  if (/\b(religion|religious belief|ethnicity|ethnic group|political affiliation|political belief)\b/i.test(text)) {
    blockers.add("Possible unsupported sensitive-trait inference.");
  }
  if (/\b(definitely|certainly|guaranteed|always|never fails)\b/i.test(text)) {
    warnings.add("Overconfident language detected; qualify the claim or add supporting evidence.");
  }

  return { warnings: [...warnings], blockers: [...blockers] };
}
