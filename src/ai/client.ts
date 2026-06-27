/**
 * LLM provider abstraction for Lodestar.
 *
 * MVP ships with a deterministic mock provider so every AI service works
 * without an API key. Real providers (OpenAI, Anthropic, etc.) must be added
 * behind this same interface — never imported directly into services.
 *
 * No service should call a provider SDK directly. Always go through
 * `getLLMClient()` so behaviour stays mockable and testable.
 */

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMCompletionRequest = {
  /** Logical task name, used for routing the mock and for logging. */
  task: string;
  messages: LLMMessage[];
  /** Arbitrary structured context the mock can read to shape its reply. */
  context?: Record<string, unknown>;
};

export type LLMCompletionResult = {
  /** Raw text the model produced. Services parse/validate this with Zod. */
  text: string;
  modelName: string;
  tokenInput: number;
  tokenOutput: number;
};

export interface LLMClient {
  readonly modelName: string;
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResult>;
}

/** Rough token estimate so AgentRun records carry a usable number in mock mode. */
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.round(text.length / 4));
}

/**
 * Deterministic mock client. It echoes a JSON payload that callers pass in via
 * `context.mockResponse`, so each service owns its own canned output and we keep
 * provider-specific prompt-shaping out of this file.
 */
class MockLLMClient implements LLMClient {
  readonly modelName = "mock";

  async complete(request: LLMCompletionRequest): Promise<LLMCompletionResult> {
    const mock = request.context?.mockResponse;
    const text =
      typeof mock === "string" ? mock : JSON.stringify(mock ?? {}, null, 2);

    const inputText = request.messages.map((m) => m.content).join("\n");

    return {
      text,
      modelName: this.modelName,
      tokenInput: estimateTokens(inputText),
      tokenOutput: estimateTokens(text),
    };
  }
}

let cachedClient: LLMClient | null = null;

/**
 * Returns the active LLM client. Mock by default. When a real provider is
 * wired in, branch here on an env flag (e.g. LLM_PROVIDER) — services never
 * change.
 */
export function getLLMClient(): LLMClient {
  if (!cachedClient) {
    cachedClient = new MockLLMClient();
  }
  return cachedClient;
}
