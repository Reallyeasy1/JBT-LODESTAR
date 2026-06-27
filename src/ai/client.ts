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

export function getLLMClient(): LLMClient {
  return mockLLMClient;
}
