# Spec: [Issue title here]

> Copy this file to `specs/issue-<N>-<slug>.md` and fill every section before writing any code.
> The spec-critic must stamp APPROVED in the Critic Log before a branch is created.

---

## Issue

- **Closes:** #N
- **Title:** [exact issue title]
- **Labels:** [area:X, priority:pX, size:X, agent:X]

---

## Problem & Goal

> One sentence: what user outcome does this issue enable?

[Fill here]

---

## Non-goals

> Explicit scope fence — what this issue does NOT do. Forces the author to make conscious cuts.

- Not building: [X]
- Not changing: [Y]
- Deferred to: [issue #N or "future"]

---

## Approach

> How will you solve it? 2–5 sentences of prose. No code yet — describe the design.

[Fill here]

---

## Data / Contract changes

> Any changes to Prisma schema, service function signatures, or shared types.
> Write "None" if this issue makes no data or service contract changes.

```ts
// Example: new service function signature
export async function generateBriefing(
  contactId: string,
  userId: string,
): Promise<BriefingOutput>
```

[Fill here or write "None"]

---

## API / UI contract

> New or changed API routes (method, path, request/response shape) and/or component props.
> Write "None" if no routes or components are added/changed.

```ts
// Example: POST /api/briefings
// Request: { contactId: string }
// Response: { briefing: BriefingOutput; agentRunId: string }
```

[Fill here or write "None"]

---

## Acceptance criteria

> Binary pass/fail. No subjective criteria. Must exactly match or improve on the issue.

- [ ] [Criterion 1 — measurable and binary]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

---

## Test plan

> Steps to manually verify all acceptance criteria above.

1. [Step 1]
2. [Step 2]

---

## Risks & mitigations

> What could go wrong? What's the mitigation? Write "None identified" only if truly none.

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| [Risk] | Low / Med / High | [What you'll do] |

---

## Open questions

> Questions that must be answered before this spec can be APPROVED.
> Populated by the author; answered during the critic loop; must all be resolved before APPROVE.

- [ ] Q1: [question]

---

## Critic Log

> Maintained by the spec-critic agent. Do not edit manually.

| Round | Date | Verdict | Summary |
|-------|------|---------|---------|
| 1 | YYYY-MM-DD | DRAFT | Spec authored |

<!-- APPROVED stamp written here by spec-critic after final pass -->
