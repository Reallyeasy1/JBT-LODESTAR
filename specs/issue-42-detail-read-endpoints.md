# Spec: Implement missing detail-read endpoints and interaction API

> Copy this file to `specs/issue-<N>-<slug>.md` and fill every section before writing any code.
> The spec-critic must stamp APPROVED in the Critic Log before a branch is created.

---

## Issue

- **Closes:** #42
- **Title:** Implement missing detail-read endpoints and interaction API
- **Labels:** area:backend, priority:p0, size:m, needs-contract, agent:fullstack-builder

---

## Problem & Goal

Enable frontend detail pages (`/rankings/[rankingId]`, `/contacts/[contactId]`) to fetch their data by ID, and allow interaction notes to be saved — completing the missing read API surface that currently blocks those pages.

---

## Non-goals

- Not building: `POST /api/contact-imports`, `POST /api/feedback` (explicitly deferred in issue)
- Not changing: existing ranking/briefing/follow-up POST generation behaviour
- Not changing: `GET /api/briefings?contactId=...` (query-param variant stays)
- Deferred to: future — pagination, filtering, aggregation on these endpoints

---

## Approach

Three of the five required endpoints already landed on `main` from a parallel PR:
- `GET /api/contacts/[contactId]/route.ts` ✅
- `GET /api/rankings/[rankingId]/route.ts` ✅
- `POST /api/interactions/route.ts` ✅

The remaining two follow the identical pattern: add a service function that queries Prisma scoped to `userId`, then add a thin route handler. For `briefing`, the `toBriefingDetail` helper and `BriefingDetail` type already exist in the service — only a `getBriefingById` function is needed. For `followup`, we define a `FollowUpDetail` type and `getFollowUpById` function alongside the existing `generateFollowUp`.

---

## Data / Contract changes

```ts
// briefing.service.ts — new function
export async function getBriefingById(
  briefingId: string,
  userId: string,
): Promise<BriefingDetail | null>

// followup.service.ts — new type + function
export type FollowUpDetail = {
  id: string;
  contactId: string;
  interactionId: string | null;
  subject: string | null;
  draftText: string | null;
  status: string;
  recommendedTiming: string | null;
  userApproved: boolean;
  sentAt: Date | null;
  createdAt: Date;
};

export async function getFollowUpById(
  followUpId: string,
  userId: string,
): Promise<FollowUpDetail | null>
```

No schema changes — all fields exist in Prisma.

---

## API / UI contract

```ts
// GET /api/briefings/[briefingId]
// Response 200: BriefingDetail
// Response 404: { error: "Briefing not found" }

// GET /api/followups/[followupId]
// Response 200: FollowUpDetail
// Response 404: { error: "Follow-up not found" }
```

Both endpoints scope the lookup to the current mock user (`getCurrentUser().id`) so cross-user access returns 404, not 403.

---

## Acceptance criteria

- [ ] `GET /api/briefings/[briefingId]` returns 200 with `BriefingDetail` for a valid briefingId owned by the current user
- [ ] `GET /api/briefings/[briefingId]` returns 404 for a missing or cross-user briefingId
- [ ] `GET /api/followups/[followupId]` returns 200 with `FollowUpDetail` for a valid followUpId owned by the current user
- [ ] `GET /api/followups/[followupId]` returns 404 for a missing or cross-user followUpId
- [ ] Existing `GET /api/briefings?contactId=...` POST and generation routes remain unchanged
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run lint` exits 0

---

## Test plan

1. Run `npx prisma db seed` to get seeded briefing/followup records
2. Call `GET /api/briefings/<seeded-briefing-id>` → expect 200 with BriefingDetail fields
3. Call `GET /api/briefings/nonexistent-id` → expect 404
4. Call `GET /api/followups/<seeded-followup-id>` → expect 200 with FollowUpDetail fields
5. Call `GET /api/followups/nonexistent-id` → expect 404
6. Verify existing `POST /api/briefings` and `GET /api/briefings?contactId=...` still work
7. `npx tsc --noEmit && npm run lint`

---

## Risks & mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Route naming collision with existing briefings/followups route.ts | Low | Use `[briefingId]` and `[followupId]` sub-directories, not top-level route.ts |
| Cross-user data leak | Low | Service scopes query to `userId` via `findFirst({ where: { id, userId } })` |

---

## Open questions

*(none — scope is fully defined by existing patterns)*

---

## Critic Log

| Round | Date | Verdict | Summary |
|-------|------|---------|---------|
| 1 | 2026-06-27 | DRAFT | Spec authored |
| 2 | 2026-06-27 | APPROVED | Both endpoints verified against code/schema; FollowUpDetail fields match Prisma; no BLOCKERs/QUESTIONs. SUGGESTIONs noted (getBriefingById already on main; response-shape inconsistency; Zod-on-GET clarification) |
