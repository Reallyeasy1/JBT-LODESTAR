type VerificationType = "briefing" | "ranking" | "followup" | "localisation";

type VerificationResult = {
  warnings: string[];
  blockers: string[];
};

const stereotypeChecks: Array<{ pattern: RegExp; warning: string }> = [
  {
    pattern: /\bbecause they are\s+[a-z][a-z -]+/i,
    warning: "Removed or review unsupported demographic reasoning: 'Because they are ...'.",
  },
  {
    pattern: /\bas a\s+[a-z][a-z -]+\s+(person|businessperson|professional)\b/i,
    warning: "Removed or review unsupported demographic reasoning: 'As a ... person/professional'.",
  },
  {
    pattern: /\b[a-z][a-z -]+\s+(people|culture|businesses)\s+(prefer|tend to|typically)\b/i,
    warning: "Removed or review unsupported cultural generalisation.",
  },
  {
    pattern: /\bin\s+[a-z][a-z -]+\s+culture\b/i,
    warning: "Removed or review unsupported country-culture claim.",
  },
];

const overconfidencePattern = /\b(always|guaranteed|definitely|certainly|never)\b/i;

export function checkOutput(output: unknown, type: VerificationType): VerificationResult {
  const text = collectText(output).join("\n");
  const warnings = new Set<string>();
  const blockers = new Set<string>();

  for (const check of stereotypeChecks) {
    if (check.pattern.test(text)) warnings.add(check.warning);
  }

  if ((type === "briefing" || type === "localisation") && overconfidencePattern.test(text)) {
    warnings.add("Review overconfident language before showing this output to the user.");
  }

  if (type === "followup" && /requiresUserReview["']?\s*:\s*false/i.test(text)) {
    blockers.add("Follow-up output attempted to bypass user review.");
  }

  return {
    warnings: Array.from(warnings),
    blockers: Array.from(blockers),
  };
}

function collectText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectText);
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectText);
  }
  return [];
}
