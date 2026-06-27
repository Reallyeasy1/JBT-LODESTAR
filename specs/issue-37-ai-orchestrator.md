# Spec: Add bounded AI workflow orchestrator service

> Copy this file to `specs/issue-<N>-<slug>.md` and fill every section before writing any code.
> The spec-critic must stamp APPROVED in the Critic Log before a branch is created.

---

## Issue

- **Closes:** #37
- **Title:** Add bounded AI workflow orchestrator service
- **Labels:** area:backend, area:ai, priority:p1, size:m, agent:ai-workflow-engineer

---

## Problem & Goal

Give the backend a single consistent execution path for all AI tasks so that every ranking, briefing, localisation, and follow-up is traceable through one orchestrator, reducing duplicated AgentRun boilerplate across individual services.

---

## Non-goals

- Not building: LangGraph.js, background queues, autonomous loops
- Not building: real LLM provider (mock stays)
- Not building: admin dashboard UI
- Not changing: individual service business logic — orchestrator delegates, not duplicates
- **Out of orchestrator scope:** AgentRun creation/completion and ToolCall logging — each specialist service fully owns its own AgentRun lifecycle (creates, completes with status/error). The orchestrator does not create AgentRun records, does not receive `agentRunId` back from services, and does not write ToolCall records. Issue AC #2/#3/#4 are satisfied by the delegated services, not by the orchestrator.
- Deferred to: future — exposing agentRunId in the orchestrator result (would require service signature changes)

---

## Approach

Add `src/services/agent-orchestrator.service.ts` that accepts a typed `OrchestratorTask` union and dispatches to the existing specialist services (`rankContacts`, `generateBriefing`, `generateLocalisation`, `generateFollowUp`). The orchestrator provides:

1. A typed task router that maps task type → service call (exhaustive `switch` with `never` guard)
2. A consistent error boundary that rethrows without swallowing
3. Type-safe inputs and outputs using the existing Zod output schemas

The caller supplies `userId` from the authenticated context (`getCurrentUser()` in the route handler); the orchestrator passes it through to the delegated service. The orchestrator itself never calls `getCurrentUser()`.

API route handlers that currently call services directly can optionally go through the orchestrator, but this is additive — existing callers are not required to change.

AgentRun and ToolCall lifecycle remain entirely with the delegated specialist services. The orchestrator returns only the service's typed output.

---

## Data / Contract changes

```ts
// src/services/agent-orchestrator.service.ts — new file

export type OrchestratorTask =
  | { type: "rank_contacts"; eventId: string; requestedGoal?: string; userId: string }
  | { type: "generate_briefing"; contactId: string; userId: string }
  | { type: "generate_localisation"; contactId: string; requestedLanguage?: string; userId: string }
  // draft_followup maps to generateFollowUp(input: GenerateFollowUpInput, userId):
  //   input = { contactId, interactionId?, meetingNote }
  | { type: "draft_followup"; contactId: string; interactionId?: string; meetingNote: string; userId: string };

// Returns only the service output — agentRunId stays inside each specialist service
export async function runTask(
  task: OrchestratorTask
): Promise<RankingOutput | BriefingOutput | LocalisationOutput | FollowUpOutput>
```

No schema changes. No new tables. AgentRun records are created and completed by the individual services, not by the orchestrator.

Issue AC #2 (AgentRun status:success) and AC #3 (status:error + errorMessage) are satisfied by the delegated services. Issue AC #4 (ToolCall records) is deferred — no ToolCall helpers exist yet and the orchestrator has no agentRunId to attach to.

---

## API / UI contract

None — the orchestrator is a service-layer abstraction. No new routes are added. Existing routes may optionally use `runTask` as a convenience wrapper but are not required to.

---

## Acceptance criteria

- [ ] `src/services/agent-orchestrator.service.ts` exists and exports `runTask`
- [ ] `runTask({ type: "rank_contacts", ... })` calls `rankContacts` and returns its output
- [ ] `runTask({ type: "generate_briefing", ... })` calls `generateBriefing` and returns its output
- [ ] `runTask({ type: "generate_localisation", ... })` calls `generateLocalisation` and returns its output
- [ ] `runTask({ type: "draft_followup", ... })` calls `generateFollowUp` and returns its output
- [ ] An unsupported task type causes TypeScript to report a compile error (exhaustive union via `never`)
- [ ] If a service throws, `runTask` rethrows with the original error (no swallowing)
- [ ] Existing service unit tests continue to pass
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run lint` exits 0

---

## Test plan

1. Write a basic unit test that calls `runTask` with each task type in the mock AI environment; confirm each returns the expected typed output
2. Add a new variant to `OrchestratorTask` without adding a handler → confirm `npx tsc --noEmit` errors on the `never` branch
3. Call `POST /api/rankings` via curl → confirm `AgentRun` record is created in DB with `status:success` (validates delegated service still owns lifecycle; orchestrator not required in this path)
4. `npx tsc --noEmit && npm run lint`

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Orchestrator duplicates AgentRun creation, causing double records | Med | Orchestrator must NOT call startAgentRun/completeAgentRun — delegates entirely to services |
| Adding orchestrator breaks existing API routes that import services directly | Low | Orchestrator is additive; existing imports remain unchanged |
| Type union grows unwieldy as tasks increase | Low | Union is declared in one file; exhaustive check catches missing handlers at compile time |

---

## Open questions

*(none — scope is clear from existing service signatures)*

---

## Critic Log

| Round | Date | Verdict | Summary |
|-------|------|---------|---------|
| 1 | 2026-06-27 | DRAFT | Spec authored |
| 1 | 2026-06-27 | REVISE | 3 BLOCKERs: (1) services don't expose agentRunId so OrchestratorResult.agentRunId is unbuildable without forbidden service changes; (2) ToolCall logging references non-existent agent-run.service helpers and has no agentRunId to attach to; (3) spec acceptance criteria silently drop issue AC #2/#3/#4 (AgentRun status, errorMessage, ToolCall). 2 QUESTIONs: userId source, test-plan route validity. |
