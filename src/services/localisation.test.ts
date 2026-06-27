import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createMockLocalisation } from "@/ai/mocks/localisation";
import { LocalisationOutput, LocalisationOutputSchema } from "@/ai/schemas/localisation.schema";
import { POST } from "@/app/api/localisations/route";
import { db } from "@/lib/db";
import {
  applyLocalisationVerification,
  enforceSelectedLanguage,
  generateLocalisation,
  selectStatedLanguage,
} from "@/services/localisation.service";

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

test("canonicalizes generated language casing to the stated contact language", () => {
  const output = LocalisationOutputSchema.parse({
    openerText: "はじめまして。",
    languageUsed: "japanese",
    confidenceScore: 90,
    warnings: [],
  });
  assert.equal(enforceSelectedLanguage(output, "Japanese").languageUsed, "Japanese");
});

test("rejects model output when languageUsed drifts from the selected language", () => {
  const output = LocalisationOutputSchema.parse({
    openerText: "Hi Sarah, great to meet you.",
    languageUsed: "English",
    confidenceScore: 90,
    warnings: [],
  });
  assert.throws(() => enforceSelectedLanguage(output, "Japanese"), /did not match/);
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

test("localisation API rejects invalid requests before auth or persistence", async () => {
  const response = await POST(
    new NextRequest("http://localhost/api/localisations", {
      method: "POST",
      body: JSON.stringify({ language: "Japanese" }),
    }),
  );

  assert.equal(response.status, 400);
  const body = (await response.json()) as { error?: string };
  assert.equal(body.error, "Invalid localisation request");
});

test("generateLocalisation persists the selected stated language and completes AgentRun atomically", async (t) => {
  let persistedLanguage: string | undefined;
  let agentRunStatus: string | undefined;
  let agentRunOutput: LocalisationOutput | undefined;

  t.mock.method(
    db.agentRun,
    "create",
    async () => ({ id: "agent-run-1" }) as never,
  );
  t.mock.method(
    db.contact,
    "findFirst",
    async () =>
      ({
        fullName: "Sarah Tan",
        languages: ["Japanese", "English"],
        user: {
          name: "Alex Tan",
          profile: { displayName: "Alex Tan", company: "Lodestar" },
        },
      }) as never,
  );
  t.mock.method(
    db,
    "$transaction",
    (async (callback: (tx: {
      localisation: {
        create(args: { data: { languageUsed?: string | null } }): Promise<{ id: string }>;
      };
      agentRun: {
        update(args: {
          where: { id: string };
          data: { outputJson?: unknown; status?: string };
        }): Promise<{ id: string }>;
      };
    }) => Promise<LocalisationOutput>) => {
      return callback({
        localisation: {
          async create(args) {
            persistedLanguage = args.data.languageUsed ?? undefined;
            return { id: "localisation-1" };
          },
        },
        agentRun: {
          async update(args) {
            assert.equal(args.where.id, "agent-run-1");
            agentRunStatus = args.data.status;
            agentRunOutput = LocalisationOutputSchema.parse(args.data.outputJson);
            return { id: args.where.id };
          },
        },
      });
    }) as never,
  );

  const result = await generateLocalisation("contact-1", "japanese", "user-1");

  assert.equal(result.localisationId, "localisation-1");
  assert.equal(result.languageUsed, "Japanese");
  assert.equal(persistedLanguage, "Japanese");
  assert.equal(agentRunStatus, "success");
  assert.equal(agentRunOutput?.localisationId, "localisation-1");
  assert.equal(agentRunOutput?.languageUsed, "Japanese");
});
