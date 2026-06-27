import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { getLLMClient, resetLLMClientForTests } from "@/ai/client";

type EnvKey = "AI_PROVIDER" | "OPENAI_API_KEY" | "OPENAI_MODEL" | "AI_MODEL";

async function withEnv(
  overrides: Partial<Record<EnvKey, string | undefined>>,
  run: () => Promise<void>,
): Promise<void> {
  const previous: Record<EnvKey, string | undefined> = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    AI_MODEL: process.env.AI_MODEL,
  };
  for (const [key, value] of Object.entries(overrides) as [EnvKey, string | undefined][]) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetLLMClientForTests();
  try {
    await run();
  } finally {
    for (const [key, value] of Object.entries(previous) as [EnvKey, string | undefined][]) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    resetLLMClientForTests();
  }
}

test("defaults to deterministic mock provider", async () => {
  await withEnv(
    {
      AI_PROVIDER: undefined,
      OPENAI_API_KEY: undefined,
      OPENAI_MODEL: undefined,
      AI_MODEL: undefined,
    },
    async () => {
      const result = await getLLMClient().generate({
        prompt: "Return structured output.",
        schema: z.object({ ok: z.literal(true) }),
        mockOutput: { ok: true },
      });

      assert.deepEqual(result.output, { ok: true });
      assert.equal(result.modelName, "mock-v1");
    },
  );
});

test("fails with an actionable error when vercel provider has no key", async () => {
  await withEnv(
    {
      AI_PROVIDER: "vercel",
      OPENAI_API_KEY: undefined,
    },
    async () => {
      await assert.rejects(
        () =>
          getLLMClient().generate({
            prompt: "Return structured output.",
            schema: z.object({ ok: z.literal(true) }),
            mockOutput: { ok: true },
          }),
        /OPENAI_API_KEY/,
      );
    },
  );
});

test("rejects unsupported providers", async () => {
  await withEnv(
    {
      AI_PROVIDER: "anthropic",
    },
    async () => {
      assert.throws(() => getLLMClient(), /Unsupported AI_PROVIDER/);
    },
  );
});
