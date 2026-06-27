# Spec: Add one-command local demo bootstrap

> Copy this file to `specs/issue-<N>-<slug>.md` and fill every section before writing any code.
> The spec-critic must stamp APPROVED in the Critic Log before a branch is created.

---

## Issue

- **Closes:** #35
- **Title:** Add one-command local demo bootstrap
- **Labels:** area:data, area:docs, area:devops, priority:p0, size:s, agent:data-backend-engineer

---

## Problem & Goal

Enable any teammate or reviewer to go from a fresh clone to a fully-seeded, running Lodestar demo with a single documented command sequence — removing the current gap where the Docker stack exists but the bootstrap path is undocumented.

---

## Non-goals

- Not building: cloud deployment (separate #28 / Railway issue)
- Not changing: real LLM provider setup (AI_PROVIDER=mock for demo)
- Not building: production secrets management
- Not replacing MySQL with another database
- Not creating a new Docker image or modifying the existing Dockerfile

---

## Approach

The Docker Compose stack (`docker-compose.yml`) and Prisma seed (`prisma/seed.ts`) already exist, as do committed migrations in `prisma/migrations/`. The work is:

1. Verify `.env.example` contains all variables needed for local run. **Already complete** — `DATABASE_URL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `NODE_ENV` are present. `AI_PROVIDER` and `NEXT_PUBLIC_DEMO_EVENT_ID` are forward-looking documentation placeholders; `AI_PROVIDER` is read by AI client code, `NEXT_PUBLIC_DEMO_EVENT_ID` is for convenience linking in README (the event route resolves from the URL path param, not this env var). Add them as documented-but-optional entries with comments.
2. Add convenience npm scripts in `package.json`: `demo:setup` runs `prisma migrate deploy && prisma db seed` (not `db push` — committed migrations exist in `prisma/migrations/` and must be the source of truth; `db push` would bypass migration history and cause drift if `migrate dev` is later run). `demo:reset` is a brief note in README (not a script) pointing to `docker compose down -v`.
3. Write a clear `## Local Development` section in `README.md` covering: prerequisites, clone, copy env, `docker compose up -d`, `npm run demo:setup`, `npm run dev`, visit `/events/cle00000000000000000001`. Note: the seeded event resolves because the mock `getCurrentUser()` returns the seed user id `clu00000000000000000001` that matches the event's `userId`.
4. Add a troubleshooting / reset subsection.
5. `prisma/seed.ts` already uses `upsert` for all demo records — no changes needed. The audit step is verify-only.

All changes are documentation + `package.json` scripts only — no source files added or changed.

---

## Data / Contract changes

None — no schema or service changes.

---

## API / UI contract

None.

---

## Acceptance criteria

- [ ] `README.md` has a `## Local Development` section with step-by-step instructions a fresh clone can follow without prior Lodestar knowledge
- [ ] `.env.example` includes `DATABASE_URL`, `AI_PROVIDER=mock`, `NEXT_PUBLIC_DEMO_EVENT_ID=cle00000000000000000001` and any other variables referenced in the codebase
- [ ] `package.json` has a `demo:setup` script that runs `prisma migrate deploy && prisma db seed`
- [ ] Running `demo:setup` twice completes without error (migrate deploy is a no-op when migrations are already applied; seed is idempotent via upsert)
- [ ] Following `README.md` instructions from a clean Docker state results in the app serving the seeded event at `/events/cle00000000000000000001`
- [ ] README includes a reset/reseed troubleshooting section
- [ ] `npx tsc --noEmit` and `npm run lint` pass (package.json script additions don't break lint)

---

## Test plan

1. Run `docker compose down -v` to wipe local DB volume
2. Run `docker compose up -d` and wait for MySQL to report healthy
3. Follow the README `## Local Development` instructions exactly as written
4. Run `npm run demo:setup` — expect `migrate deploy` to apply 2 migrations then seed to upsert 6 contacts
5. Run `npm run dev`
6. Visit `http://localhost:3000/events/cle00000000000000000001` — confirm seeded contacts appear (6 contacts including Sarah Tan)
7. Run `npm run demo:setup` again — confirm no error (idempotent)
8. Check README troubleshooting section guides through `docker compose down -v` → fresh start

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Seed uses `create` not `upsert` → fails on second run | Med | Audit seed.ts; convert any `create` for demo records to `upsert` |
| .env.example missing a variable the app reads at startup | Low | Grep codebase for `process.env.` and cross-check against .env.example |
| Docker MySQL not ready when Prisma runs | Low | Document `docker compose up -d` wait, or add a brief note to wait for healthy status |

---

## Open questions

*(none)*

---

## Critic Log

| Round | Date | Verdict | Summary |
|-------|------|---------|---------|
| 1 | 2026-06-27 | DRAFT | Spec authored |
| 1 | 2026-06-27 | REVISE | 1 BLOCKER (db push vs existing migrations), 2 QUESTIONs (push-vs-migrate decision, unused env vars). Seed already idempotent; .env.example already complete. |
