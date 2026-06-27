# GitHub Issues Workflow

**Owner:** lodestar-orchestrator
**Last updated:** 2026-06-27

GitHub Issues are the shared task queue for all Lodestar agents and human teammates.

---

## Label Taxonomy

### Status Labels (one per issue at all times)

| Label | Hex | Meaning |
|-------|-----|---------|
| `status:ready` | `#0075ca` | Available to claim — no assignee, dependencies met |
| `status:in-progress` | `#e4e669` | Claimed and being worked |
| `status:blocked` | `#d93f0b` | Cannot proceed — see blocking label |
| `status:review` | `#a2eeef` | PR open, waiting for QA or human review |
| `status:done` | `#0e8a16` | Merged and closed |

### Area Labels

| Label | Meaning |
|-------|---------|
| `area:frontend` | Next.js pages, components, API routes |
| `area:backend` | Service functions, utility libs |
| `area:data` | Prisma schema, migrations, seed, queries |
| `area:ai` | AI service functions, prompts, Zod schemas |
| `area:safety` | Privacy, security, cultural guardrails |
| `area:qa` | Quality assurance, testing |
| `area:okf` | OKF knowledge bundle files |
| `area:docs` | Planning docs, CLAUDE.md, README |
| `area:devops` | CI/CD, deployment, env config |

### Agent Labels

| Label | Agent |
|-------|-------|
| `agent:product-architect` | product-architect |
| `agent:fullstack-builder` | fullstack-builder |
| `agent:data-backend-engineer` | data-backend-engineer |
| `agent:ai-workflow-engineer` | ai-workflow-engineer |
| `agent:safety-qa-engineer` | safety-qa-engineer |

### Priority Labels

| Label | Meaning |
|-------|---------|
| `priority:p0` | Must ship for demo to work |
| `priority:p1` | Important, ship after p0 |
| `priority:p2` | Nice-to-have, defer until core works |

### Size Labels

| Label | Meaning |
|-------|---------|
| `size:s` | ≤4 hours of work |
| `size:m` | ~1 day of work |
| `size:l` | 2+ days of work — consider splitting |

### Qualifier Labels

| Label | Meaning |
|-------|---------|
| `parallel-safe` | No file conflicts with other active issues |
| `needs-contract` | Produces schema or API contract others depend on |
| `blocked-by-schema` | Needs Prisma migration to complete first |
| `blocked-by-api` | Needs API route/service contract first |
| `blocked-by-design` | Needs product/UX decision first |

---

## Issue Lifecycle

```
Draft (in _workspace/issue_backlog.md)
    ↓ orchestrator creates on GitHub
status:ready (unassigned)
    ↓ agent claims
status:in-progress (assigned, branch created)
    ↓ agent opens PR
status:review (PR open, waiting for QA)
    ↓ QA passes
status:done (merged, closed)
```

---

## Parallel Safety Rules

Issues are `parallel-safe` if they touch different parts of the codebase.

**Safe to run in parallel:**
- `area:data` + `area:okf` (different directories)
- `area:docs` + any (docs don't conflict with code)
- Different `area:frontend` issues if on different pages

**Not safe to run in parallel:**
- Two issues touching the same Prisma model
- Two issues touching the same API route file
- `area:data` schema issue + any `blocked-by-schema` issue

---

## Branch Naming

```
issue-<number>-<short-descriptive-slug>
```

Examples:
- `issue-2-prisma-schema-seed`
- `issue-3-event-dashboard`
- `issue-6-briefing-mock-service`

---

## Commit Message Format

```
feat: [description] — closes #N
fix: [description] — closes #N
chore: [description] — refs #N
```

---

## Agent Selection Matrix

When an agent picks the next issue:

| Agent | Picks labels | Avoids |
|-------|-------------|--------|
| product-architect | `agent:product-architect`, `area:docs` | `area:data`, `area:ai` |
| fullstack-builder | `area:frontend`, `agent:fullstack-builder` | `blocked-by-schema`, `blocked-by-api` |
| data-backend-engineer | `area:data`, `area:backend`, `agent:data-backend-engineer` | — |
| ai-workflow-engineer | `area:ai`, `area:okf`, `agent:ai-workflow-engineer` | `blocked-by-schema` (unless confirmed stable) |
| safety-qa-engineer | `area:safety`, `area:qa`, `status:review` | implementation issues |
