---
name: lodestar-ai-workflows
description: Implements bounded AI service functions for Lodestar: contact briefing, deterministic contact ranking, cultural localisation, follow-up draft generation, and output verification. Builds LLM provider abstraction and Zod output schemas. Maintains OKF knowledge bundle. Use for any area:ai, area:okf, or agent:ai-workflow-engineer GitHub issue.
---

# Lodestar AI Workflows Skill

## Purpose
Build all AI-powered service functions as deterministic TypeScript. Every AI call is bounded, structured, Zod-validated, logged to AgentRun, and produces a draft for user review. Never autonomous.

## When to Use
- Implementing a new AI service function
- Wiring up a real LLM provider after mock is working
- Adding or updating Zod output schemas
- Updating OKF knowledge files
- Building or updating the verification service

---

## Step 1: Claim the Issue
Follow `lodestar-github-workflow` skill - claim, branch, comment plan.

---

## Step 2: LLM Provider Abstraction

File: `src/ai/client.ts`

```ts
interface LLMClient {
  generate<T>(params: {
    prompt: string;
    systemPrompt?: string;
    schema: z.ZodSchema<T>;
    modelName?: string;
  }): Promise<{ output: T; tokenInput: number; tokenOutput: number; latencyMs: number }>
}

// Mock implementation (default, works without API keys)
export const mockLLMClient: LLMClient = { ... }

// Real implementation (swap in via env var)
export const getLLMClient = (): LLMClient =>
  process.env.LLM_PROVIDER === "anthropic" ? anthropicClient : mockLLMClient
```

---

## Step 3: Ranking Service (deterministic first - no LLM required)

File: `src/services/ranking.service.ts`

Implement scoring exactly:
```ts
type ContactScoreBreakdown = {
  goalMatch: number;          // 0-25: keyword overlap between contact data and event goal
  roleRelevance: number;      // 0-15: seniority and function match to goal
  decisionInfluence: number;  // 0-15: is this person a decision-maker?
  companyIndustryFit: number; // 0-10: company industry vs event industry
  sharedContext: number;      // 0-10: shared tags, mutual connections, event history
  followupClarity: number;    // 0-10: user notes contain a clear next action? -> boost
  reciprocity: number;        // 0-5: did contact show interest (interaction outcome)?
  freshness: number;          // 0-5: how recently was this contact added/interacted with?
  evidenceConfidence: number; // 0-5: how many data fields are populated?
}
```

The ranking service must produce a valid `RankingOutputSchema` result without any LLM call. LLM is optional - adds `reasoning` text only.

---

## Step 4: Briefing Service

File: `src/services/briefing.service.ts`

Call flow:
1. Load: user profile, event, contact (via Prisma through db.ts)
2. Build prompt using `src/ai/prompts/briefing.ts`
3. Call `getLLMClient().generate({ schema: BriefingOutputSchema })`
4. Run `verificationService.check(output)` - adds warnings if needed
5. `await agentRunService.completeAgentRun(...)` - log result
6. Save to `Briefing` table via Prisma
7. Return briefing with any verification warnings

---

## Step 5: Follow-Up Service

File: `src/services/followup.service.ts`

Rules:
- Input: meeting notes (user-written), contact data, user profile
- Output: `FollowUpOutputSchema` - always `requiresUserReview: true`
- Save as `status: "drafted"` to `FollowUp` table
- Never send externally - ever

---

## Step 6: Verification Service (deterministic checks first)

File: `src/services/verification.service.ts`

Check for:
1. Overconfident language: "definitely", "certainly", "always" -> add warning
2. Cultural stereotyping phrases: "Because they are X" -> BLOCKER warning
3. Unsupported sensitive trait mentions (religion, ethnicity, politics) -> BLOCKER warning
4. Claims not grounded in contact data fields -> add warning

LLM verification can be added later - deterministic regex/pattern checks are sufficient for MVP.

---

## Step 7: OKF Knowledge Files

OKF files provide durable policy and rubric context to AI services. Read them at prompt-build time.

OKF files must never contain:
- Contact names, emails, phone numbers
- User profile data
- Uploaded business card content
- Agent run logs

---

## Files to Inspect
- `prisma/schema.prisma` (data shapes for service inputs)
- `_workspace/technical_plan.md` (service contract section)
- `okf/concepts/opportunity-scoring.md` (ranking rubric)
- `okf/safety/anti-stereotyping.md` (cultural guardrail)

## Files to Modify
- `src/ai/client.ts`, `src/ai/prompts/`, `src/ai/schemas/`
- `src/services/briefing.service.ts`
- `src/services/cultural-briefing.service.ts`
- `src/services/followup.service.ts`
- `src/services/ranking.service.ts`
- `src/services/verification.service.ts`
- `okf/` (knowledge files only)

## Anti-Overengineering Rules
- Implement mock AI before real provider - demo must work without API keys
- Do not add vector embeddings or semantic search in MVP
- Do not build a streaming response endpoint until basic response works
- Do not add LLM caching until it's measurably needed
- Do not call the LLM more than once per user action in MVP

## Acceptance Criteria
- `ranking.service.ts` returns correctly scored and ordered contacts without LLM
- All AI outputs pass Zod validation before any DB write
- `followup.service.ts` always returns `requiresUserReview: true`
- `verification.service.ts` catches stereotyping phrases in test inputs
- All service functions log `AgentRun` records
- Service function signatures published to `_workspace/technical_plan.md`

## Common Failure Modes
- Saving AI output before Zod validation -> corrupt data in DB
- Forgetting `requiresUserReview: true` on follow-ups -> safety violation
- Calling LLM from ranking service before deterministic score works -> blocks demo
- Storing inferred cultural trait in a Prisma field -> safety violation
