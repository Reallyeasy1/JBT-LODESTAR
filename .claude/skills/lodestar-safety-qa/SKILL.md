---
name: lodestar-safety-qa
description: Reviews Lodestar code changes for privacy risks, prompt injection, cultural stereotyping, API/frontend contract mismatches, forbidden external actions, and type errors. Runs build and lint. Use for any area:safety, area:qa, or agent:safety-qa-engineer GitHub issue, or when any PR touches AI services, ranking logic, or cultural content and is ready for merge.
---

# Lodestar Safety & QA Skill

## Purpose
Adversarial review of every PR before merge. Find BLOCKERs early so they don't reach production. Do not implement — flag and verify fixes.

## When to Use
- A PR is labelled `status:review`
- Any PR touches `src/ai/`, `src/services/`, or `okf/`
- Before a milestone demo
- After a migration (verify OKF isolation)
- After a new API route is added (verify auth and injection)

---

## Step 1: Claim the Issue
Follow `lodestar-github-workflow` skill — claim, branch (or work on review branch), comment review plan.

---

## Step 2: Run Build and Type Checks

```bash
npx tsc --noEmit        # must exit 0 — BLOCKER if it fails
npm run lint            # must exit 0 — BLOCKER if it fails
npx prisma validate     # validates schema syntax
```

If either fails, the PR cannot merge. Document every type error and lint violation as BLOCKER.

---

## Step 3: Safety Review Checklist

Run every item on every AI-touching PR:

| # | Check | Severity if failed |
|---|-------|--------------------|
| 1 | Any code path sends email/message without explicit user approval? | BLOCKER |
| 2 | Any code infers cultural identity from name, nationality, or company? | BLOCKER |
| 3 | Any prompt concatenates unsanitised user input without injection guard? | BLOCKER |
| 4 | Any `okf/` file contains contact names, emails, or uploaded content? | BLOCKER |
| 5 | `followup.service.ts` always sets `requiresUserReview: true`? | BLOCKER |
| 6 | All AI outputs validated through Zod before any DB write? | BLOCKER |
| 7 | Every AI call creates an `AgentRun` record? | WARNING |
| 8 | API response shapes match frontend hook/component expectations? | BLOCKER |
| 9 | Any `linkedin.com` URL or scraping import exists? | BLOCKER |
| 10 | Private user data exposed to unauthenticated routes? | BLOCKER |

---

## Step 4: API/Frontend Contract Cross-Check

For every new or modified API route:
1. Find the corresponding frontend page/hook that calls it
2. Compare response shape: do the field names and types match?
3. Verify error response shape is handled in the frontend

For every new or modified service function:
1. Find all callers (API routes or server actions)
2. Verify function signature matches usage

---

## Step 5: Cultural Content Review

For any PR touching `src/ai/prompts/`, `src/services/briefing.service.ts`, `src/services/cultural-briefing.service.ts`, or `okf/`:

Check:
- Does the prompt explicitly forbid nationality-to-personality inferences?
- Does the output schema include a `culturalNotes[]` field with uncertainty language?
- Does any hardcoded text make a cultural claim without explicit user data?

Allowed output example: "Their profile lists Japanese as preferred language. Open with a short Japanese greeting."
Forbidden output example: "Because they are Japanese, they prefer indirect communication."

---

## Step 6: Write Review Comment

Structure every review comment as:

```
## QA Review — Issue #N

### Build
- [x] `tsc --noEmit` exits 0
- [x] `npm run lint` exits 0

### BLOCKERs (must fix before merge)
- [ ] ...

### WARNINGs (should fix)
- [ ] ...

### SUGGESTIONs (optional)
- [ ] ...

### Acceptance Criteria Verification
- [x] AC1: ...
- [ ] AC2: ... (not met — reason)

**Verdict: BLOCKED / PASS**
```

---

## Step 7: Update QA Checklist
Add any new violation pattern found to `_workspace/qa_checklist.md`.
If a new safety pattern emerges, add it to the appropriate `okf/safety/` file.

---

## Files to Inspect (all read-only except safety docs)
- All `src/` files in the PR diff
- `okf/safety/` (can update)
- `_workspace/qa_checklist.md` (can update)

## Anti-Overengineering Rules
- Do not write test suites during QA review — flag missing tests as a WARNING, not BLOCKER (unless the issue explicitly required tests)
- Do not refactor code found during review — flag it as a SUGGESTION only
- Do not block a merge for style issues unless the linter catches them

## Acceptance Criteria
- Zero BLOCKERs at merge time
- `tsc --noEmit` and `npm run lint` both exit 0
- All 10 safety checks documented in review comment
- `_workspace/qa_checklist.md` updated with any new patterns

## Common Failure Modes
- Reviewing only the diff without reading the callers → misses contract mismatches
- Marking warnings as blockers → slows down shipping unnecessarily
- Not re-running `tsc` after a fix is applied → missing secondary type errors
- Approving without checking if `requiresUserReview: true` is literally set — check the actual Zod schema, not just the service comment
