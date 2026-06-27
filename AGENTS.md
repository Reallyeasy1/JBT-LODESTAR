# AGENTS.md

This file provides Codex project instructions for Lodestar. It is the Codex equivalent of `CLAUDE.md` plus the `.claude/agents/` and `.claude/skills/` harness.

## Project

Lodestar is an AI-powered networking operating system for conferences and professional events.

Core promise:

> Lodestar turns every event contact into a ranked next action.

Tagline:

> Scan the room. Know who matters. Follow up before the opportunity goes cold.

The first vertical slice is:

```txt
Demo user
-> Demo event
-> Demo contacts
-> Rank top contacts
-> Open contact briefing
-> Draft follow-up
```

## Start Every Session

1. Read `_workspace/agent_handoff.md` first when it exists.
2. Read `_workspace/technical_plan.md` before changing schema, service contracts, API routes, or UI.
3. Check current repo state with `git status --short`.
4. Preserve user changes. Never revert unrelated work unless the user explicitly asks.
5. Keep work scoped to the current issue/request and the approved MVP stack.

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
npx prisma db push
npx prisma db seed
npx prisma studio

# Lint
npm run lint
```

## Locked Stack

- Frontend: Next.js App Router
- Language: TypeScript
- Styling: Tailwind CSS
- Database: MySQL
- ORM: Prisma
- Validation: Zod for all AI outputs
- Auth: mock `getCurrentUser()` placeholder first; prepare for Clerk/Auth.js later
- File upload: local placeholder first; prepare abstraction for S3/R2 later
- LLM: provider abstraction in `src/ai/client.ts`; mock default
- Deployment: Vercel-compatible

Do not add PostgreSQL, graph DB, vector DB, Kubernetes, autonomous background agents, LinkedIn scraping, or automatic external sending.

## Architecture

Use deterministic workflows with bounded AI functions:

```txt
User action
-> API route/server action
-> Database write
-> Service function
-> AI generation if needed
-> Verification
-> Save draft
-> User review
```

AI outputs must be structured, Zod-validated, editable, traceable through `AgentRun`, and saved as drafts. Never let AI mutate the database directly or decide tools/actions freely.

## Key Directories

| Path | Purpose |
|------|---------|
| `src/app/api/` | Next.js route handlers |
| `src/services/` | Business logic called by API routes/server actions |
| `src/ai/` | LLM client abstraction, prompts, Zod schemas |
| `src/tools/` | Stateless parsers and utilities |
| `src/lib/` | `db.ts`, `auth.ts`, `audit.ts`, validators |
| `src/components/` | React components grouped by domain |
| `okf/` | Durable agent knowledge; never user/contact storage |
| `_workspace/` | Planning, contracts, handoff, QA checklist |
| `.codex/` | Codex role and workflow playbooks |

## Data Model Rules

- IDs: `String @id @default(uuid())`
- Long strings: `@db.Text`
- Flexible AI payloads: `Json`
- Queryable core fields must be real columns, not only JSON
- Use Prisma query APIs; avoid raw SQL unless Prisma cannot express the query
- OKF must never contain private user data, contact data, uploaded content, agent logs, or tool logs

## Ranking Model

Contacts are scored deterministically before any LLM call:

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

Rules: high title does not imply high rank without goal relevance. Clear next-action notes boost `followupClarity`. Weak evidence lowers confidence.

## AI Output Schemas

Canonical schemas live in `src/ai/schemas/`:

- `BriefingOutputSchema`: `personSummary`, `whyTheyMatter`, `likelyGoal?`, `decisionAuthority`, `talkingPoints[]`, `questionsToAsk[]`, `culturalNotes[]`, `warnings[]`, `confidenceScore`
- `RankingOutputSchema`: `goal`, `rankedContacts[]` with `contactId`, `rank`, `score`, `opportunityType`, `reasoning`, `nextAction`, `confidence`, `evidence[]`
- `FollowUpOutputSchema`: `subject`, `draftText`, `recommendedTiming`, `reasoning`, `confidence`, `requiresUserReview: true`

## Cultural And Privacy Guardrails

Allowed: grounded language/localisation advice based on explicit stated preference.

Forbidden:

- Inferring personality, culture, religion, ethnicity, politics, or preferences from nationality, name, company, or surname
- Saving inferred sensitive traits as database fields
- LinkedIn scraping
- Auto-sending email, WhatsApp, Telegram, or any external message
- Storing private user/contact data in `okf/`

Use wording like: "Their profile lists Japanese as a preferred language. You can open with a short Japanese greeting." Avoid: "Because they are Japanese, they prefer indirect communication."

## Agent Team Routing

Use these Codex role playbooks in `.codex/agents/` when work matches their scope:

| Scope | Role playbook |
|------|---------------|
| Cross-area coordination, sprint planning, blockers | `.codex/agents/lodestar-orchestrator.md` |
| Product scope, demo story, issue refinement | `.codex/agents/product-architect.md` |
| Prisma, MySQL, seed, identity resolution, logging | `.codex/agents/data-backend-engineer.md` |
| AI services, Zod schemas, prompts, OKF, verification | `.codex/agents/ai-workflow-engineer.md` |
| Next.js pages, components, API route handlers | `.codex/agents/fullstack-builder.md` |
| Safety, privacy, QA, build/type/lint review | `.codex/agents/safety-qa-engineer.md` |

For sprint launch behavior, use `.codex/commands/sprint.md`.

## GitHub Issue Workflow

When working from GitHub issues:

1. Only claim `status:ready` unassigned issues matching the relevant `area:*` or `agent:*` label.
2. Add assignee, add `status:in-progress`, remove `status:ready`.
3. Comment a short plan: files, approach, scope, dependencies.
4. Create a branch from main: `issue-<N>-<short-slug>`.
5. Keep changes minimal and inside issue scope.
6. Open PR with summary, files changed, test plan, risks, and screenshots for UI.
7. Move issue to `status:review`.
8. Safety QA reviews before `status:done`.

Concurrency cap: no more than 3 issues `status:in-progress` at once.

## Quality Bar

- `npx tsc --noEmit` exits 0 before merge
- `npm run lint` exits 0 before merge
- `npx prisma validate` exits 0 after schema changes
- Seed is idempotent and creates the demo vertical slice
- Ranking works without any LLM
- Every AI output is Zod-validated before save
- Every follow-up remains a draft and includes `requiresUserReview: true`
- No autonomous external actions exist anywhere in the codebase
