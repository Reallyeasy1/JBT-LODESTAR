import assert from "node:assert/strict";

import { FollowUpOutputSchema } from "@/ai/schemas/followup.schema";
import { buildMockDraft } from "@/services/followup.service";

const contact = {
  fullName: "Mina Park",
  title: "VP Operations",
  company: "Northstar CRM",
};

const sparseDraft = buildMockDraft(
  contact,
  "Alex Tan",
  "Discussed CRM workflow pain."
);

const sparseText = `${sparseDraft.subject}\n${sparseDraft.body}`.toLowerCase();

assert.equal(sparseDraft.requiresUserReview, true);
assert.match(sparseDraft.body, /Discussed CRM workflow pain\./);

for (const unsupportedClaim of [
  "sup build2026",
  "hackathon",
  "singapore",
  "deck",
  "traction",
  "numbers",
  "schedule",
  "longer chat",
  "encouragement",
]) {
  assert.equal(
    sparseText.includes(unsupportedClaim),
    false,
    `Mock draft should not invent unsupported claim: ${unsupportedClaim}`
  );
}

const blankDraft = buildMockDraft(contact, "Alex Tan", "   ");
const blankText = `${blankDraft.subject}\n${blankDraft.body}`.toLowerCase();

assert.equal(blankDraft.requiresUserReview, true);

for (const unsupportedClaim of [
  "sup build2026",
  "hackathon",
  "deck",
  "traction",
  "schedule",
]) {
  assert.equal(
    blankText.includes(unsupportedClaim),
    false,
    `Blank-note mock draft should stay generic: ${unsupportedClaim}`
  );
}

assert.throws(() =>
  FollowUpOutputSchema.parse({
    subject: "Hello",
    body: "Draft body",
    suggestedTone: "professional",
    requiresUserReview: false,
  })
);
