# Agent Handoff Log

**Last updated:** 2026-06-27
**Owner:** lodestar-orchestrator

This file records phase completions, current state, and what's queued for each agent. Read this first in every session.

---

## Current Phase: Sprint 1 — Full Demo Vertical Slice

**Sprint goal:** Full demo walkable end-to-end — schema seeded → event dashboard → ranking → contact briefing → localised intro → follow-up draft. All p0 issues (#2–#8, #13) merged and runnable in ≤30 seconds.
**Sprint length:** 7 days (started 2026-06-27)
**Capacity:** 35 agent-days (5 agents × 7 days)

### Completed
- [x] Harness bootstrapped (2026-06-27)
- [x] MVP scope audited and trimmed to wedge (2026-06-27)
  - Onboarding, Dashboard, Event creation, Manual contact entry → Deferred
  - Issue #13 (localisation service) added to cover demo step 5
  - product_scope.md updated; issue_backlog.md updated

### In Progress
- Nothing yet — sprint starting

### Sprint Backlog (ordered by start day)

| # | Issue | Size | Agent | Track | Start day | Status |
|---|-------|------|-------|-------|-----------|--------|
| 1 | MVP scope doc | s | product-architect | B | Day 1 | ready |
| 2 | Prisma schema + seed | m | data-backend-engineer | A | Day 1 | ready |
| 9 | OKF bundle | s | ai-workflow-engineer | B | Day 1 | ready |
| 10 | QA checklist | s | safety-qa-engineer | B | Day 1 | ready |
| 4 | Ranking service | m | ai-workflow-engineer | C | Day 2 | blocked-by-#2 |
| 3 | Event dashboard | m | fullstack-builder | D | Day 2 | blocked-by-#2 |
| 6 | Briefing service | s | ai-workflow-engineer | C | Day 3 | blocked-by-#2 |
| 8 | Follow-up service | s | ai-workflow-engineer | C | Day 3 | blocked-by-#2 |
| 5 | Ranking UI | m | fullstack-builder | D | Day 3 | blocked-by-#4 |
| 13 | Localisation service | s | ai-workflow-engineer | C | Day 4 | blocked-by-#6 |
| 11 | Safety audit | s | safety-qa-engineer | B | Day 4 | blocked-by-#4,#6,#8 |
| 7 | Contact detail page | m | fullstack-builder | D | Day 5 | blocked-by-#6,#8,#13 |
| 12 | Demo polish | m | product-arch+fullstack | E | Day 6 | blocked-by-all-p0 |

### Blocked
- #3, #4, #6, #8, #13 — waiting for #2 (schema)
- #5 — waiting for #4 (ranking service)
- #7 — waiting for #6, #8, #13
- #12 — waiting for all p0

### Pre-sprint prerequisite
⚠️ Repo has no Next.js scaffold yet. data-backend-engineer must run `npx create-next-app@latest --typescript --tailwind --app` as the very first step of Issue #2 before any other code work starts.

---

## Agent Assignments

| Agent | Current issue | Status | Last activity |
|-------|-------------|--------|--------------|
| lodestar-orchestrator | — | Idle | 2026-06-27 (harness setup) |
| product-architect | — | Idle | — |
| fullstack-builder | — | Idle | Waiting for Phase 2 |
| data-backend-engineer | — | Idle | Ready to start |
| ai-workflow-engineer | — | Idle | Ready to start (OKF issue) |
| safety-qa-engineer | — | Idle | Waiting for Phase 3 |

---

## Dependency Map

```
Issue #2 (schema+seed)  ←  CRITICAL PATH — everything gates here
  ↓ unblocks
  ├── #3 (event dashboard)
  ├── #4 (ranking service) → #5 (ranking UI)
  ├── #6 (briefing service) → #13 (localisation service)
  └── #8 (follow-up service)
       ↓  #6 + #8 + #13 all needed
      #7 (contact detail page)
           ↓ all p0 done
          #12 (demo polish)

Parallel from Day 1 (no dependencies):
- #1 (scope doc), #2 (schema), #9 (OKF), #10 (QA checklist)

QA safety audit (#11) unlocks after #4, #6, #8 merged.
```

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-27 | MySQL only, no PostgreSQL | Requirements locked |
| 2026-06-27 | Mock AI before real LLM | Demo must work without API keys |
| 2026-06-27 | Deterministic ranking before LLM ranking | Unblocks frontend earlier |
| 2026-06-27 | getCurrentUser() mock before Clerk | Simplifies MVP, abstraction prepared |
