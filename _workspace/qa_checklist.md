# QA & Safety Checklist

**Owner:** safety-qa-engineer
**Last updated:** 2026-06-27

---

## Pre-Merge Gate (run on every PR)

### Build Checks
- [ ] `npx tsc --noEmit` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npx prisma validate` exits 0 (on schema changes)

### Safety Checks (AI-touching PRs)
- [ ] No code path sends email/message without explicit user action
- [ ] No code infers cultural identity from name, nationality, surname, or company
- [ ] No prompt concatenates unsanitised user input
- [ ] No `okf/` file contains contact names, emails, phone numbers, or uploaded content
- [ ] `followup.service.ts` always sets `requiresUserReview: true` — verified in Zod schema
- [ ] All AI outputs pass Zod validation before any Prisma write
- [ ] Every AI call creates an `AgentRun` record
- [ ] No `linkedin.com` URL, scraping import, or data-fetch in codebase
- [ ] Private user data not exposed to unauthenticated routes

### Contract Checks
- [ ] API response shapes match frontend hook/component expectations
- [ ] Service function signatures match all callers (API routes + server actions)
- [ ] Prisma schema types match service function parameter types

---

## Forbidden Patterns (auto-BLOCKER)

If any of these are found, block the PR unconditionally:

```
// FORBIDDEN — auto-send
nodemailer.sendMail(...)
sgMail.send(...)
fetch("https://api.sendgrid.com/...")  // without user action
fetch("https://api.linkedin.com/...")  // any LinkedIn API
fetch("https://linkedin.com/...")      // any LinkedIn URL

// FORBIDDEN — cultural stereotyping
"Because they are [nationality]"
"As a [nationality] person"
"Japanese people prefer"
"Chinese business culture requires"

// FORBIDDEN — storing inferred identity
prisma.contact.update({ data: { religion: ... } })
prisma.contact.update({ data: { ethnicity: ... } })
prisma.contact.update({ data: { politics: ... } })

// FORBIDDEN — bypassing Zod
prisma.briefing.create({ data: llmOutput })  // without z.parse() first

// FORBIDDEN — requiresUserReview missing
z.object({ requiresUserReview: z.boolean() })  // must be z.literal(true)
```

---

## Cultural Content Review Template

When reviewing any cultural content in prompts or service outputs:

```
Allowed: "Their profile lists [language] as preferred. You can open with [greeting]."
Forbidden: "Because they are [nationality], they [personality trait/communication style]."

Check: Does the prompt explicitly instruct the LLM to base cultural suggestions on STATED user preferences only?
Check: Does the output schema include uncertainty language in cultural notes?
```

---

## Review Comment Template

```markdown
## QA Review — Issue #N (PR #M)

### Build
- [ ] `tsc --noEmit` exits 0
- [ ] `npm run lint` exits 0

### BLOCKERs (must fix before merge)
<!-- list here, or "None" -->

### WARNINGs (should fix)
<!-- list here, or "None" -->

### SUGGESTIONs (optional)
<!-- list here, or "None" -->

### Acceptance Criteria
- [ ] AC1: ...
- [ ] AC2: ...

**Verdict: BLOCKED | PASS**
```

---

## Findings Log

| Date | Issue # | Finding | Severity | Status |
|------|---------|---------|----------|--------|
| 2026-06-27 | — | Harness setup — no findings yet | — | — |
| 2026-06-27 | #11 | Final stacked audit: no LinkedIn scraping/API fetch, no automatic sender dependency/code, no autonomous loop code, `requiresUserReview` is structurally locked to `z.literal(true)`, AI writes are schema-validated, and API routes are scoped with `getCurrentUser()` | — | PASS |

---

## Final Safety Audit — Issue #11

**Audit date:** 2026-06-27  
**Branch audited:** `codex/issue-11-final-safety-audit` stacked on `codex/issue-12-demo-polish`  
**Verdict:** PASS

### Required grep checks

| Check | Command | Result |
|-------|---------|--------|
| LinkedIn scraping/API usage | `grep -RIn "linkedin" src/` | PASS with allowed matches only: stored `linkedinUrl` fields/tests and identity matching against user-provided URLs. No LinkedIn fetch, API call, scraper, crawler, or external request code. |
| Automatic send dependencies/code | `grep -RInE "sendMail\|sendgrid\|nodemailer" src/` | PASS — no matches. |
| Follow-up review invariant | `grep -RIn "requiresUserReview" src/services/followup.service.ts` | PASS — `z.literal(true)` and persisted outputs force `requiresUserReview: true`. |
| Autonomous loops | `grep -RInE "autonomous\|setInterval\|cron" src/` | PASS — no matches. |

### Additional safety checks

| Check | Result |
|-------|--------|
| LinkedIn fetch/scraping patterns (`fetch.*linkedin`, `api.linkedin`, `linkedin.com`, scraper/crawler libraries) | PASS — no matches in `src/`. |
| Automatic sending patterns (`sgMail.send`, generic mail transports, `mailto:`) | PASS — no matches in `src/`. |
| Cultural inference/stereotyping | PASS — prompt files explicitly forbid inferring culture, nationality, religion, ethnicity, politics, or preferences from names/company/location; stereotype strings appear only in negative tests and verification rules. |
| Zod validation before AI Prisma writes | PASS — briefing, ranking, follow-up, and localisation outputs are parsed before/around writes; follow-up additionally validates the review invariant before persistence. |
| AgentRun coverage | PASS — briefing, ranking, follow-up, and localisation services call `startAgentRun` and `completeAgentRun`. |
| API auth scoping | PASS — every route in `src/app/api` imports/calls `getCurrentUser()` before user-scoped service operations. |
| Build/test gate | PASS — `npm test`, `npm run typecheck`, `npm run lint`, `DATABASE_URL='mysql://user:pass@localhost:3306/lodestar' npx prisma validate`, and `DATABASE_URL='mysql://user:pass@localhost:3306/lodestar' npm run build` all exited 0. |
