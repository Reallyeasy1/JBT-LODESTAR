# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Lodestar — AI-powered networking OS for conferences. Turns event contacts into ranked next actions with briefings, cultural notes, and follow-up drafts.

Tagline: *Scan the room. Know who matters. Follow up before the opportunity goes cold.*

---

## Commands

```bash
# Install
npm install

# Dev server
npm run dev

# Type check
npx tsc --noEmit

# Prisma
npx prisma generate
npx prisma migrate dev --name <name>
npx prisma db push           # fast schema sync without migration file
npx prisma db seed
npx prisma studio

# Lint
npm run lint
```

---

## Stack

- **Next.js App Router** + TypeScript + Tailwind CSS
- **MySQL** (not PostgreSQL) via **Prisma** ORM
- **Zod** for all AI output validation
- Auth: mock `getCurrentUser()` placeholder — prepare for Clerk/Auth.js but don't implement yet
- File upload: local placeholder — abstraction ready for S3/R2 later
- LLM: provider abstraction in `src/ai/client.ts` — mockable, no real provider required for MVP
- No queue, no vector DB, no graph DB, no Kubernetes

---

## Architecture: Deterministic Workflows Only

Every user action follows this pipeline — never let AI mutate the database directly:

```
User action → API route/server action → DB write → Service function
→ AI generation (if needed) → Verification → Save draft → User review
```

All AI-generated content (briefings, rankings, follow-ups) must be:
- Structured (Zod-validated)
- Editable by the user
- Associated with an `AgentRun` record
- Saved as a draft, never auto-sent

No autonomous agent loops. No free-running AI that decides tools or actions.

---

## Key Directories

| Path | Purpose |
|------|---------|
| `src/app/api/` | API routes (Next.js route handlers) |
| `src/services/` | Business logic; called by API routes |
| `src/ai/` | LLM client abstraction + prompts + Zod schemas |
| `src/tools/` | Parsers (VCF, QR, OCR) — stateless utilities |
| `src/lib/` | `db.ts` (Prisma client), `auth.ts` (getCurrentUser), `audit.ts`, `validators.ts` |
| `src/components/` | React components grouped by domain |
| `okf/` | Agent knowledge (workflows, rules, rubrics, safety docs) — no user data |

---

## Data Model Conventions

- IDs: `String @id @default(uuid())`
- Flexible AI payloads: `Json` fields (`evidence`, `warnings`, `metadata`, `tags`)
- Core queryable fields stay as real columns, not buried in JSON
- MySQL-specific: use `@db.Text` for long strings

---

## Scoring Model

Contacts are scored deterministically before any LLM call. The breakdown (max 100):

| Dimension | Max |
|-----------|-----|
| goalMatch | 25 |
| roleRelevance | 15 |
| decisionInfluence | 15 |
| companyIndustryFit | 10 |
| sharedContext | 10 |
| followupClarity | 10 |
| reciprocity | 5 |
| freshness | 5 |
| evidenceConfidence | 5 |

Rules: high title ≠ high rank without goal relevance. Contacts with clear next-action notes get a boost. Weak evidence lowers confidence.

---

## AI Output Schemas (Zod)

Three canonical schemas live in `src/ai/schemas/`:

- `BriefingOutputSchema` — `personSummary`, `whyTheyMatter`, `decisionAuthority` (enum), `talkingPoints[]`, `questionsToAsk[]`, `culturalNotes[]`, `warnings[]`, `confidenceScore` (0–100)
- `RankingOutputSchema` — `rankedContacts[]` with `opportunityType` enum: `investor | customer | collaborator | mentor | hire | recruiter | friend | other`
- `FollowUpOutputSchema` — always includes `requiresUserReview: true` (literal)

---

## Cultural Guardrails

Cultural suggestions are **allowed** only when grounded in explicit user-stated preference:
- ✅ "Their profile lists Japanese as preferred language. You can open with a short Japanese greeting."
- ❌ "Because they are Japanese, they prefer indirect communication."

Never infer or save personality traits from nationality, religion, ethnicity, or politics. `verification.service.ts` checks for overconfident or stereotyping output before saving.

---

## OKF Knowledge Bundle

`okf/` contains durable agent knowledge: workflows, ranking rubrics, cultural guardrails, safety rules. It is **not user storage** — no contact data, no images, no agent logs, no inferred traits go here.

---

## Demo Seed Data

Seed script creates: user **Alex Tan** (Founder, Lodestar) → event **Sup Build2026 Hackathon** (Singapore, AI/startups) → 6 contacts including one intentional duplicate (Sarah Tan / Sarah T.) to demo identity resolution.

The demo vertical slice: Dashboard → Rank → Open contact → Briefing → Add note → Draft follow-up.

---

## What Not To Do

- No PostgreSQL
- No vector database (initial scaffold)
- No graph database
- No Kubernetes
- No autonomous background agents
- No LinkedIn scraping
- No auto-sending follow-ups (always drafts)
- No AI stereotyping from nationality/ethnicity
- No overengineering before the core workflow demo works

---

## Harness: Lodestar Agent Team

**Goal:** Coordinate six Claude Code development agents to build Lodestar in parallel using GitHub Issues as the shared task queue.

**Trigger:** For any Lodestar development task involving multiple areas (frontend, data, AI, safety), use the `lodestar-orchestrate` skill. For single-agent tasks, invoke the relevant skill directly:
- `lodestar-product-planning` — scope, demo script, issue refinement
- `lodestar-data-backend` — Prisma schema, migrations, seed data
- `lodestar-fullstack-build` — Next.js pages, components, API routes
- `lodestar-ai-workflows` — AI services, Zod schemas, OKF files
- `lodestar-safety-qa` — safety reviews, build checks, contract verification
- `lodestar-github-workflow` — claim an issue, create a branch, open a PR

**Planning docs:** `_workspace/` — read `agent_handoff.md` first in every session.

**Agent teams require:** `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

**Change History:**
| Date | Change | Target | Reason |
|------|--------|--------|--------|
| 2026-06-27 | Initial harness setup | All | Bootstrap 6-agent team for parallel development |
