---
name: lodestar-data-backend
description: Implements MySQL + Prisma schema, migrations, seed data, identity resolution, and data-layer service functions for Lodestar. Use for any area:data, area:backend, or agent:data-backend-engineer GitHub issue. Invoke when schema changes, migrations, seed scripts, duplicate detection, or backend service functions need work.
---

# Lodestar Data & Backend Skill

## Purpose
Build and maintain the MySQL data layer that is the source of truth for all Lodestar data. Every data change goes through Prisma. No exceptions.

## When to Use
- Any new model or field added to schema
- Running a migration
- Building or updating seed data
- Implementing a service function (identity resolution, contact capture, agent run logging)
- Any `area:data` or `area:backend` GitHub issue

---

## Step 0: Spec Gate (hard — runs before any code)
Invoke the `lodestar-spec-driven` skill for this issue. Author `specs/issue-<N>-<slug>.md`, get `spec-critic` APPROVE. **No branch, no code until APPROVED.** See `specs/TEMPLATE.md` for the required shape.

---

## Step 1: Claim the Issue
Follow `lodestar-github-workflow` skill — claim, branch, comment plan. Branch only after spec is APPROVED.

---

## Step 2: Read Existing Schema
```bash
cat prisma/schema.prisma
npx prisma studio  # optional: inspect data visually
```
Understand all existing models and relations before adding anything.

---

## Step 3: Schema Changes

### Rules
- IDs: always `String @id @default(uuid())`
- Long text fields: always `@db.Text`
- Flexible AI payloads: `Json` type (evidence, warnings, metadata, tags)
- Core queryable fields: real columns, not buried in JSON
- Relations: explicit `onDelete` behaviour on every relation
- Indexes: add `@@index` for all foreign keys and common query patterns

### After schema change:
```bash
npx prisma migrate dev --name descriptive-name
npx prisma generate
```

Publish the schema change to `_workspace/technical_plan.md` (data section) and comment on all `blocked-by-schema` issues that migration is complete.

---

## Step 4: Seed Script

Seed must always create the complete demo vertical slice:

```ts
// prisma/seed.ts structure
// 1. Upsert demo user (Alex Tan)
// 2. Upsert demo profile
// 3. Upsert demo event (Sup Build2026 Hackathon)
// 4. Upsert 6 contacts with ranking-relevant fields populated
//    - Include intentional duplicate (Sarah Tan / Sarah T.)
//    - Include varied roles, companies, industries
//    - Include enough notes for ranking demo to work
// 5. Create one sample ranking run
```

```bash
npx prisma db seed
```

Verify: `npx prisma studio` → confirm all tables populated.

---

## Step 5: Identity Resolution Service

File: `src/services/identity-resolution.service.ts`

Signature:
```ts
type ResolutionResult = "duplicate" | "possible-duplicate" | "new"

async function resolveContact(
  input: ContactInput,
  userId: string
): Promise<{ result: ResolutionResult; existingContactId?: string; confidence: number }>
```

Match logic (in priority order):
1. Exact email match → `duplicate`
2. Exact phone match → `duplicate`
3. Exact LinkedIn URL match → `duplicate`
4. Same normalised full name + same company → `possible-duplicate`
5. No match → `new`

---

## Step 6: AgentRun Service

File: `src/services/agent-run.service.ts`

Every AI call must create an `AgentRun` record. Provide:
```ts
async function startAgentRun(params: {
  userId: string; taskType: string; agentType: string;
  modelName?: string; promptVersion?: string; inputJson: unknown;
}): Promise<string> // returns agentRunId

async function completeAgentRun(agentRunId: string, params: {
  outputJson: unknown; status: "success" | "error";
  latencyMs: number; tokenInput?: number; tokenOutput?: number;
  errorMessage?: string;
}): Promise<void>
```

---

## Files to Inspect
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/db.ts`
- `PROJECT_REQUIREMENTS.md` (schema section)

## Files to Modify
- `prisma/schema.prisma`
- `prisma/migrations/` (generated)
- `prisma/seed.ts`
- `src/lib/db.ts`, `src/lib/audit.ts`
- `src/services/identity-resolution.service.ts`
- `src/services/agent-run.service.ts`
- `src/services/contact-capture.service.ts`

## Anti-Overengineering Rules
- Do not add a caching layer until a slow query is measured
- Do not use raw SQL unless Prisma cannot express the query
- Do not add a search index until full-text search is a confirmed requirement
- Do not implement soft-delete unless the issue explicitly requires it

## Acceptance Criteria
- `npx prisma db push && npx prisma db seed` runs clean with zero errors
- `npx prisma generate` exits 0 and types are updated
- Identity resolution correctly identifies the Sarah Tan / Sarah T. duplicate in seed data
- All `AgentRun` records include userId, taskType, status, latencyMs
- `_workspace/technical_plan.md` updated with current schema summary

## Common Failure Modes
- Running migration without `prisma generate` → TS types stale
- Seed script crashes if run twice → use upsert, not create
- Missing `@@index` on foreign keys → slow queries on contacts table
- OKF directory accidentally receiving contact data → check `okf/` after every seed run
