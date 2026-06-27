---
name: lodestar-orchestrate
description: Orchestrates the full Lodestar Codex development team. Use for starting development phases, planning sprints, assigning GitHub issues to agents, resolving cross-agent blockers, merging competing plans, or asking "what should we build next" or "start a new phase." Runs fan-out planning, supervisor implementation, and producer-reviewer QA cycles. Invoke whenever work needs coordination across multiple Lodestar agents.
---

# Lodestar Orchestrate Skill

## Purpose
Coordinate the Lodestar agent team through three execution patterns matching the project's build phases.

## Execution Mode
Hybrid:
- **Phase 1 - Planning**: Fan-out (subagents in parallel) -> Fan-in (orchestrator merges)
- **Phase 2 - Implementation**: Supervisor (orchestrator assigns issues dynamically)
- **Phase 3 - QA**: Producer-Reviewer (builders -> safety-qa-engineer)

---

## Phase 0: Context Check (always run first)

1. Read `_workspace/technical_plan.md` - does it exist and is it current?
2. Read `_workspace/agent_handoff.md` - what was last completed?
3. Check GitHub for any `status:in-progress` issues
4. Determine run mode:
   - No `_workspace/` -> **Initial run** (full Phase 1-3)
   - `_workspace/` exists + partial work request -> **Partial re-run** (skip to relevant phase)
   - `_workspace/` exists + new sprint request -> **Sprint planning** (Phase 1-B: issue triage only)

---

## Phase 1: Planning Fan-Out

Invoke three subagents **in parallel** (run_in_background: true):

**product-architect subagent**
- Input: `PROJECT_REQUIREMENTS.md`, `_workspace/product_scope.md` if exists
- Output: updated `_workspace/product_scope.md`, prioritised feature list, demo script
- Model: opus

**data-backend-engineer subagent**
- Input: `PROJECT_REQUIREMENTS.md` schema section, `prisma/schema.prisma` if exists
- Output: schema plan appended to `_workspace/technical_plan.md` (data section)
- Model: opus

**ai-workflow-engineer subagent**
- Input: `PROJECT_REQUIREMENTS.md` AI sections, `_workspace/product_scope.md`
- Output: service function signatures appended to `_workspace/technical_plan.md` (AI section)
- Model: opus

Wait for all three to complete. Merge results into unified `_workspace/technical_plan.md`.

**Dependency conflict resolution:**
- Schema and service contract must align before frontend starts
- If schema and AI plans conflict, resolve in favour of schema (MySQL is source of truth)
- Document conflicts in `_workspace/agent_handoff.md`

---

## Phase 2: Implementation Supervision

Assign `status:ready` GitHub issues to agents following this dependency order:

| Order | Label pattern | Assign to |
|-------|--------------|-----------|
| 1st | `area:data`, `needs-contract` | `data-backend-engineer` |
| 2nd | `area:ai`, `area:backend` | `ai-workflow-engineer` or `data-backend-engineer` |
| 3rd | `area:frontend` | `fullstack-builder` |
| Any time | `area:okf`, `parallel-safe` | `ai-workflow-engineer` |
| Last | `area:safety`, `area:qa` | `safety-qa-engineer` |

**Assignment rules:**
- Only assign `status:ready` issues - never `status:blocked`
- Cap: <=3 issues `status:in-progress` at any time
- Prefer `parallel-safe` issues when multiple agents are active simultaneously
- One agent per issue - no shared ownership

**Per-issue assignment flow:**
1. Write plan comment on issue (see `lodestar-github-workflow` skill)
2. Agent implements and opens PR
3. Agent moves issue to `status:review`
4. `safety-qa-engineer` reviews
5. Orchestrator merges on pass or assigns fix to owning agent on BLOCKER

---

## Phase 3: QA Cycle

After each implementation batch, invoke `safety-qa-engineer` subagent:
- Input: list of PRs ready for review, `_workspace/qa_checklist.md`
- Output: BLOCKER / WARNING / SUGGESTION list per PR, pass/fail verdict

Orchestrator decisions:
- **BLOCKER found** -> assign fix back to owning agent, do not merge, re-queue for QA
- **WARNING found** -> document in issue, merge at orchestrator discretion
- **All clear** -> merge PR, close issue, move to `status:done`

---

## Phase 4: Handoff Update (after every phase)

Update:
- `_workspace/agent_handoff.md` - what was completed, what's queued next
- `_workspace/technical_plan.md` - any deviations from plan
- AGENTS.md harness change log with date and description

---

## Anti-Overengineering Rules
- A feature requiring a new database type -> stop and escalate to user
- A feature requiring autonomous agent loops -> cut from scope
- An issue spanning more than 5 files outside its domain -> split before assigning
- A sprint containing more than 10 issues -> cut to `priority:p0` only first

---

## Acceptance Criteria
- `_workspace/technical_plan.md` reflects current implementation state
- All `priority:p0` issues are `status:done` or actively `status:in-progress`
- Demo vertical slice runs end-to-end without errors
- `safety-qa-engineer` has reviewed all AI-touching PRs
- `npx tsc --noEmit` exits 0 across the codebase

## Common Failure Modes
- Starting frontend before schema is stable -> enforce Phase 2 dependency order strictly
- Orchestrator implements code instead of delegating -> stop, create an issue, delegate
- Too many concurrent in-progress issues -> drain queue before adding more
- Blocking on `blocked-by-schema` without flagging schema agent -> mark blocker, notify `data-backend-engineer`
