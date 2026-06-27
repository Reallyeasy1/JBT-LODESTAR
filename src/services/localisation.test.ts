import assert from "node:assert/strict";
import test from "node:test";
import { createMockLocalisation } from "@/ai/mocks/localisation";
import { LocalisationOutputSchema } from "@/ai/schemas/localisation.schema";
import {
  applyLocalisationVerification,
  selectStatedLanguage,
} from "@/services/localisation-rules";

const promptInput = {
  contact: {
    fullName: "Sarah Tan",
    statedLanguages: ["Japanese", "English"],
  },
  user: {
    displayName: "Alex Tan",
    company: "Lodestar",
  },
  selectedLanguage: "Japanese",
};

test("selects only an explicitly stated contact language", () => {
  assert.equal(selectStatedLanguage(["Japanese", "English"], "japanese"), "Japanese");
  assert.throws(
    () => selectStatedLanguage(["Japanese", "English"], "Mandarin"),
    /not listed/,
  );
});

test("mock Japanese opener is non-empty and schema-valid", () => {
  const output = LocalisationOutputSchema.parse(createMockLocalisation(promptInput));
  assert.equal(output.languageUsed, "Japanese");
  assert.ok(output.openerText.length > 0);
});

test("stereotype output is warned and loses confidence", () => {
  const unsafe = LocalisationOutputSchema.parse({
    openerText: "Because they are Japanese, they always prefer an indirect greeting.",
    languageUsed: "Japanese",
    confidenceScore: 90,
    warnings: [],
  });
  const verified = applyLocalisationVerification(unsafe);
  assert.ok(verified.warnings.some((warning) => warning.startsWith("BLOCKED:")));
  assert.ok(verified.confidenceScore < unsafe.confidenceScore);
});
