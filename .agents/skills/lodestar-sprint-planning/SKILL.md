---
name: lodestar-sprint-planning
description: Runs a structured Lodestar sprint planning session. Ask all required questions before reading files, selecting issues, or assigning agents.
---

# Lodestar Sprint Planning Skill

## Purpose

Produce a concrete sprint plan: goal, selected issues, agent assignments, parallel/serial groupings, day-by-day sequence, risks, and QA gates. All planning must be grounded in answers the user gives upfront.

## Phase 1 - Ask All Questions First

Before reading files or selecting issues, ask all questions below in one message. Do not start planning until every question has an answer. The user may answer "skip" or "default" for optional ones.

### Required questions

**Q1 - Sprint goal**
What should be shippable or demonstrable at the end of this sprint?

**Q2 - Sprint length**
How many days is this sprint?

**Q3 - Concurrent capacity**
How many agents or teammates will be working concurrently?

**Q4 - Available agents**
Which agents are available for this sprint?
- product-architect
- fullstack-builder
- data-backend-engineer
- ai-workflow-engineer
- safety-qa-engineer

Default: all five.

**Q5 - Must-have issues**
Are there any issues that must be completed this sprint, regardless of priority?

**Q6 - Explicit exclusions**
Are there any issues to exclude from this sprint entirely?

**Q7 - Hard constraints**
Any external deadlines, demo dates, or blockers?

**Q8 - Current codebase state**
What has already been built or merged?

**Q9 - Parallel safety preference**
Should agents work in parallel where possible, or serially?

Default: parallel where dependency order allows.

**Q10 - QA gate**
Should every issue go through `safety-qa-engineer` review before closing, only AI-touching issues, or skip for now?

## Phase 2 - Read Current State

Only after the user has answered all questions:

1. Read `_workspace/issue_backlog.md`.
2. Read `_workspace/agent_handoff.md`.
3. Read `_workspace/technical_plan.md`.
4. Check GitHub issues if `gh` is available:

```bash
gh issue list --state all --limit 50
```

## Phase 3 - Build Sprint Plan

### Filter issue pool

- Remove issues the user excluded.
- Remove issues already `status:done`.
- Add user-designated must-have issues where possible.
- Respect available agents.

### Respect dependency order

```txt
#2 schema must complete before #3, #4, #5, #6, #7, #8
#4 ranking service must complete before #5 ranking UI
#6 briefing service and #8 followup service must complete before #7 contact page
```

### Group parallel tracks

If parallel:

- Track A: `data-backend-engineer` -> schema + seed (#2)
- Track B: parallel-safe immediately: `product-architect` (#1), `ai-workflow-engineer` (#9), `safety-qa-engineer` (#10, #11)
- Track C after #2: `ai-workflow-engineer` (#4, #6, #8)
- Track D after service contracts: `fullstack-builder` (#3, #5, #7)

If serial, order issues strictly by dependency.

### Fit sprint length

Use issue sizes:

- `size:s`: about 0.5 days
- `size:m`: about 1 day
- `size:l`: about 2 days

Cap the sprint at `sprint days * concurrent agents` agent-days. Defer lowest-priority issues that do not fit.

### Apply QA gate

- Every issue: add a `safety-qa-engineer` review step after every PR.
- AI-touching only: add review gates after #4, #6, and #8.
- Skip: note as a risk.

## Phase 4 - Output Sprint Plan

```txt
## Sprint [N] Plan
**Goal:** [Q1 answer]
**Length:** [Q2] days
**Capacity:** [Q2 * Q3] agent-days
**Agents:** [Q4 list]

### Sprint Backlog (ordered)
| # | Issue | Size | Agent | Depends on | Track |
|---|-------|------|-------|------------|-------|

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

## Phase 5 - Write To Workspace And Offer GitHub Actions

1. Update `_workspace/agent_handoff.md` with the sprint plan.
2. Ask: "Should I create/update the GitHub issues now with the sprint labels?"
3. If yes, output the `gh issue edit` commands, then run them.
4. If no, leave the plan as draft.

## Anti-Overengineering Rules

- Do not add issues to the sprint that are not in the backlog without user approval.
- Do not extend sprint length to fit more issues.
- Do not assign an issue to an unavailable agent.
- Do not skip Phase 1 questions.

## Common Failure Modes

- Skipping Q8 and double-planning already merged work.
- Ignoring Q7 constraints.
- Stuffing too many issues into the sprint.
- Forgetting QA gates for AI code.
