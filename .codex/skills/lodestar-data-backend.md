---
name: lodestar-data-backend
description: Playbook for Prisma/MySQL schema, migrations, seed data, identity resolution, contact capture, audit, and AgentRun work.
---

# Lodestar Data & Backend Playbook

Use for schema, migration, seed, identity resolution, contact capture, audit, and `AgentRun` work.

## Steps

1. Follow `.codex/skills/lodestar-github-workflow.md` if working from an issue.
2. Read `prisma/schema.prisma` and `_workspace/technical_plan.md`.
3. Make schema changes with MySQL-compatible Prisma only.
4. Run:

```bash
npx prisma migrate dev --name descriptive-name
npx prisma generate
```

For fast local sync when appropriate:

```bash
npx prisma db push
npx prisma db seed
```

5. Update `_workspace/technical_plan.md` with schema/service contract changes.
6. Comment on dependent `blocked-by-schema` issues when unblocked.

## Identity Resolution

Priority:

1. Exact email -> duplicate
2. Exact phone -> duplicate
3. Exact LinkedIn URL -> duplicate
4. Normalized full name + company -> possible duplicate
5. No match -> new

## AgentRun Contract

Provide:

```ts
startAgentRun(params): Promise<string>
completeAgentRun(agentRunId, params): Promise<void>
```

Every AI call path must log input, output, status, latency, and task metadata.
