/**
 * Verification service.
 *
 * Scans AI-generated output for safety violations BEFORE it is saved. The first
 * and most important check is anti-stereotyping: AI must never make a
 * personality or communication-style claim based on nationality, ethnicity,
 * religion, or any demographic group. See `okf/safety/anti-stereotyping.md`.
 *
 * When a violation is found we DO NOT silently scrub the text — we surface a
 * warning to the user and lower the confidence score so the user reviews it.
 */

import type { BriefingOutput } from "@/ai/schemas/briefing.schema";

export type StereotypeFinding = {
  pattern: string;
  matchedText: string;
  warning: string;
};

/** Penalty applied to confidenceScore when any stereotyping pattern is found. */
export const STEREOTYPE_CONFIDENCE_PENALTY = 20;

type StereotypeRule = {
  label: string;
  regex: RegExp;
  warning: string;
};

/**
 * Pattern rules drawn directly from `okf/safety/anti-stereotyping.md`.
 * All are case-insensitive. They are intentionally conservative — a false
 * positive only adds a review warning, which is the safe direction to fail.
 */
const STEREOTYPE_RULES: StereotypeRule[] = [
  {
    label: "because-they-are",
    // "Because they are Japanese", "because they're German", etc.
    regex: /\bbecause\s+(?:they|he|she)\s*(?:'re|\s+are|\s+is)\s+[A-Za-z]+/i,
    warning:
      "Possible demographic stereotype: an attribute is justified with 'because they are [X]'. Verify this is grounded in stated data, not background.",
  },
  {
    label: "nationality-people-tend-to",
    // "Japanese people prefer", "German culture tends to", "Chinese businesses typically"
    regex:
      /\b[A-Z][a-z]+\s+(?:people|culture|businesses|men|women)\s+(?:prefer|tend\s+to|typically|usually|are|value|expect)\b/,
    warning:
      "Possible demographic generalisation about a nationality or group ('[X] people/culture tend to...'). Remove or ground in stated preference.",
  },
  {
    label: "as-a-nationality",
    // "As a Chinese businessperson", "Being a German professional"
    regex:
      /\b(?:as|being)\s+(?:a|an)\s+[A-Z][a-z]+\s+(?:person|businessperson|professional|man|woman|founder|executive)\b/,
    warning:
      "Possible stereotype framing ('As a [X] [person]...'). Decisions and styles must not be inferred from demographics.",
  },
  {
    label: "in-country-culture",
    // "In Japanese culture", "In German culture"
    regex: /\bin\s+[A-Z][a-z]+\s+culture\b/,
    warning:
      "Possible cultural generalisation ('In [X] culture...'). Only stated language preferences may inform cultural notes.",
  },
];

/** Scan a list of text fragments for stereotyping patterns. */
export function findStereotypes(fragments: string[]): StereotypeFinding[] {
  const findings: StereotypeFinding[] = [];
  for (const fragment of fragments) {
    if (!fragment) continue;
    for (const rule of STEREOTYPE_RULES) {
      const match = fragment.match(rule.regex);
      if (match) {
        findings.push({
          pattern: rule.label,
          matchedText: match[0],
          warning: rule.warning,
        });
      }
    }
  }
  return findings;
}

/** Collect every user-facing text fragment from a briefing for scanning. */
function collectBriefingText(briefing: BriefingOutput): string[] {
  return [
    briefing.personSummary,
    briefing.whyTheyMatter,
    briefing.likelyGoal ?? "",
    ...briefing.talkingPoints,
    ...briefing.questionsToAsk,
    ...briefing.culturalNotes,
  ];
}

export type VerifiedBriefing = {
  briefing: BriefingOutput;
  findings: StereotypeFinding[];
};

/**
 * Verify a briefing. Returns a new briefing with any anti-stereotyping warnings
 * appended and the confidence score lowered when violations are present.
 *
 * Pure: does not touch the database.
 */
export function verifyBriefing(briefing: BriefingOutput): VerifiedBriefing {
  const findings = findStereotypes(collectBriefingText(briefing));

  if (findings.length === 0) {
    return { briefing, findings };
  }

  // De-duplicate warnings (same rule can match in multiple fragments).
  const newWarnings = Array.from(new Set(findings.map((f) => f.warning)));
  const mergedWarnings = Array.from(
    new Set([...briefing.warnings, ...newWarnings])
  );

  const confidenceScore = Math.max(
    0,
    briefing.confidenceScore - STEREOTYPE_CONFIDENCE_PENALTY
  );

  return {
    briefing: {
      ...briefing,
      warnings: mergedWarnings,
      confidenceScore,
    },
    findings,
  };
}
