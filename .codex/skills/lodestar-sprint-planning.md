---
name: lodestar-sprint-planning
description: Runs a structured Lodestar sprint planning session. Ask all required questions before reading files, selecting issues, or assigning roles.
---

# Lodestar Sprint Planning Playbook

Use when starting a new sprint, re-planning mid-sprint, or when the user asks "what should we build this sprint?" or "plan the next sprint."

## Phase 1 - Ask All Questions First

Before reading files or selecting issues, ask all questions below in one message. Do not start planning until every question has an answer. The user may answer "skip" or "default" for optional items.

1. Sprint goal: what should be shippable or demonstrable at the end?
2. Sprint length: how many days is this sprint?
3. Concurrent capacity: how many agents or teammates will work concurrently?
4. Available roles: product-architect, fullstack-builder, data-backend-engineer, ai-workflow-engineer, safety-qa-engineer. Default is all five.
5. Must-have issues: any issue numbers/titles that must complete this sprint?
6. Explicit exclusions: any issues to exclude entirely?
7. Hard constraints: demo dates, deadlines, unavailable infra, blockers?
8. Current codebase state: what has already been built or merged?
9. Parallel safety preference: parallel, serial, or default parallel where dependencies allow?
10. QA gate: every issue, AI-touching only, or skip for now?

## Phase 2 - Read Current State

Only after the user answers:

1. Read `_workspace/issue_backlog.md`.
2. Read `_workspace/agent_handoff.md`.
3. Read `_workspace/technical_plan.md`.
4. If `gh` is available, check GitHub state:

```bash
gh issue list --state all --limit 50
```

## Phase 3 - Build Sprint Plan

### Filter issue pool

- Remove excluded issues.
- Remove issues already `status:done`.
- Include user-designated must-haves where possible.
- Respect available roles.

### Enforce dependencies

```txt
#2 schema must complete before #3, #4, #5, #6, #7, #8
#4 ranking service must complete before #5 ranking UI
#6 briefing service and #8 followup service must complete before #7 contact page
```

### Group tracks

If parallel:

- Track A: `data-backend-engineer` -> schema + seed (#2)
- Track B: immediately parallel-safe work: `product-architect` (#1), `ai-workflow-engineer` (#9), `safety-qa-engineer` (#10, #11)
- Track C after #2: `ai-workflow-engineer` (#4, #6, #8)
- Track D after service contracts: `fullstack-builder` (#3, #5, #7)

If serial, order issues strictly by dependency, one at a time.

### Fit capacity

Use issue size estimates:

- `size:s`: about 0.5 days
- `size:m`: about 1 day
- `size:l`: about 2 days

Capacity is `sprint days * concurrent agents` agent-days. Drop lowest-priority issues that do not fit and list them as deferred.

### Apply QA gate

- Every issue: add `safety-qa-engineer` review after every PR.
- AI-touching only: add review after #4, #6, and #8.
- Skip: note as a risk.

## Phase 4 - Output Plan

Use this format:

```txt
## Sprint [N] Plan
**Goal:** [Q1 answer]
**Length:** [Q2] days
**Capacity:** [Q2 * Q3] agent-days
**Agents:** [Q4 list]

### Sprint Backlog (ordered)
| # | Issue | Size | Role | Depends on | Track |
|---|-------|------|------|------------|-------|

### Parallel Tracks
**Day 1-2:** [what runs in parallel]
**Day 3-4:** [what unlocks]

### Deferred to Next Sprint
- #X: [reason]

### Risks
- [constraints from Q7]

### QA Gates
- [when safety-qa-engineer reviews]
```

## Phase 5 - Write Handoff And Offer GitHub Actions

1. Update `_workspace/agent_handoff.md` with the sprint plan.
2. Ask: "Should I create/update the GitHub issues now with the sprint labels?"
3. If yes, output the `gh issue edit` commands and run them.
4. If no, leave the plan as a draft.

## Anti-Overengineering Rules

- Do not add issues not in the backlog without user approval.
- Do not extend sprint length just to fit more issues.
- Do not assign unavailable roles.
- Do not skip Phase 1 questions.

## Common Failure Modes

- Skipping current-state questions and double-planning merged work.
- Ignoring demo-day constraints.
- Stuffing too many issues into one sprint.
- Forgetting QA gates for AI code.
