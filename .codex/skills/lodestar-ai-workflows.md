---
name: lodestar-ai-workflows
description: Playbook for bounded AI services, deterministic ranking, Zod schemas, prompts, verification, and OKF updates.
---

# Lodestar AI Workflows Playbook

Use for bounded AI services, deterministic ranking, Zod schemas, prompts, follow-up generation, cultural localisation, verification, and OKF.

## Steps

1. Follow `.codex/skills/lodestar-github-workflow.md` if working from an issue.
2. Read `prisma/schema.prisma`, `_workspace/technical_plan.md`, and relevant `okf/` files.
3. Implement mock-first behavior.
4. Validate all AI outputs with Zod.
5. Log every AI call to `AgentRun`.
6. Save only user-reviewable drafts.

## LLM Client Shape

```ts
interface LLMClient {
  generate<T>(params: {
    prompt: string;
    systemPrompt?: string;
    schema: z.ZodSchema<T>;
    modelName?: string;
  }): Promise<{ output: T; tokenInput: number; tokenOutput: number; latencyMs: number }>;
}
```

Default to a mock client. Real provider must sit behind `getLLMClient()`.

## Verification Checks

- Overconfident language
- Cultural stereotyping
- Unsupported sensitive traits
- Claims not grounded in available contact data
- Missing `requiresUserReview: true` for follow-ups

## Never

- Call the LLM more than once per user action in the MVP.
- Add vector embeddings or semantic search.
- Save AI output before validation.
- Store private data in OKF.
