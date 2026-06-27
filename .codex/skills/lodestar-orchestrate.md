---
name: lodestar-orchestrate
description: Playbook for cross-role coordination, phase transitions, sprint planning, blocker resolution, and integration.
---

# Lodestar Orchestration Playbook

Use for cross-role coordination, phase transitions, sprint planning, blocker resolution, and integration.

## Sprint Planning

When the user asks to plan a sprint, start a new sprint, or asks "what should we build this sprint?", stop and use `.codex/skills/lodestar-sprint-planning.md` instead of continuing here. That playbook asks all required questions first, then produces the sprint plan.

## Phase 0 - Context

1. Read `_workspace/agent_handoff.md`.
2. Read `_workspace/technical_plan.md`.
3. Check in-progress issues.
4. Determine whether this is initial planning, partial rerun, or sprint planning.

## Phase 1 - Planning

Collect or update:

- Product scope from product architect
- Schema plan from data/backend
- Service contracts from AI workflows

Merge into `_workspace/technical_plan.md`. Schema wins over AI/service conflicts because MySQL is source of truth.

## Phase 2 - Implementation

Assign ready issues in order:

1. Data/contracts
2. AI/backend
3. Frontend
4. Safety/QA

No more than 3 in progress.

## Phase 3 - QA

Safety QA reviews implementation PRs. BLOCKER means no merge; WARNING means merge only at orchestrator discretion.

## Phase 4 - Handoff

Update:

- `_workspace/agent_handoff.md`
- `_workspace/technical_plan.md`
- `AGENTS.md` change history if the harness changes materially

## Anti-Overengineering

- New database type -> stop and ask user.
- Autonomous agent loop -> cut from scope.
- Issue touches too many files -> split.
- Sprint too large -> prioritize `priority:p0`.
