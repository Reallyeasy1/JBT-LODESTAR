import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export type GenerateParams<T> = {
  prompt: string;
  systemPrompt?: string;
  schema: z.ZodType<T>;
  mockOutput: unknown;
  modelName?: string;
};

export type GenerateResult<T> = {
  output: T;
  tokenInput: number;
  tokenOutput: number;
  latencyMs: number;
  modelName: string;
};

export interface LLMClient {
  generate<T>(params: GenerateParams<T>): Promise<GenerateResult<T>>;
}

type AIProvider = "mock" | "vercel";

const DEFAULT_PROVIDER: AIProvider = "mock";
const DEFAULT_VERCEL_MODEL = "gpt-4o-mini";

function parseProvider(value: string | undefined): AIProvider {
  const normalised = value?.trim().toLowerCase();
  if (!normalised || normalised === "mock") return "mock";
  if (normalised === "vercel" || normalised === "openai") return "vercel";
  throw new Error(
    `Unsupported AI_PROVIDER "${value}". Use "mock" (default) or "vercel".`,
  );
}

function resolveProvider(): AIProvider {
  return parseProvider(process.env.AI_PROVIDER ?? DEFAULT_PROVIDER);
}

function resolveVercelModelName(explicitModelName?: string): string {
  const explicit = explicitModelName?.trim();
  if (explicit && !explicit.startsWith("mock")) return explicit;
  return (
    process.env.AI_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    DEFAULT_VERCEL_MODEL
  );
}

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "AI_PROVIDER=vercel requires OPENAI_API_KEY to be set in environment variables.",
    );
  }
  return key;
}

export const mockLLMClient: LLMClient = {
  async generate<T>(params: GenerateParams<T>): Promise<GenerateResult<T>> {
    const startedAt = Date.now();
    const output = params.schema.parse(params.mockOutput);
    return {
      output,
      tokenInput: Math.ceil(`${params.systemPrompt ?? ""}${params.prompt}`.length / 4),
      tokenOutput: Math.ceil(JSON.stringify(output).length / 4),
      latencyMs: Date.now() - startedAt,
      modelName: params.modelName ?? "mock-v1",
    };
  },
};

export const vercelLLMClient: LLMClient = {
  async generate<T>(params: GenerateParams<T>): Promise<GenerateResult<T>> {
    const startedAt = Date.now();
    const modelName = resolveVercelModelName(params.modelName);
    const openai = createOpenAI({ apiKey: getOpenAIKey() });
    const result = await generateObject({
      model: openai(modelName),
      schema: params.schema,
      system: params.systemPrompt,
      prompt: params.prompt,
    });

    return {
      output: params.schema.parse(result.object),
      tokenInput: result.usage.inputTokens ?? 0,
      tokenOutput: result.usage.outputTokens ?? 0,
      latencyMs: Date.now() - startedAt,
      modelName,
    };
  },
};

let cachedProvider: AIProvider | null = null;
let cachedClient: LLMClient | null = null;

function buildLLMClient(provider: AIProvider): LLMClient {
  if (provider === "vercel") return vercelLLMClient;
  return mockLLMClient;
}

export function getLLMClient(): LLMClient {
  const provider = resolveProvider();
  if (cachedClient && cachedProvider === provider) return cachedClient;
  const client = buildLLMClient(provider);
  cachedProvider = provider;
  cachedClient = client;
  return client;
}

export function resetLLMClientForTests(): void {
  cachedProvider = null;
  cachedClient = null;
}
