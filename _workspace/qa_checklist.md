# QA & Safety Checklist

**Owner:** safety-qa-engineer
**Last updated:** 2026-06-27

This file is the living safety review gate. Every PR must pass it before merge.
Each check is binary: PASS / FAIL / NOT APPLICABLE. Any FAIL on a **Blocking: YES**
check must be fixed before merge.

Referenced safety docs (Issue #9): `okf/safety/privacy-and-consent.md`,
`okf/safety/anti-stereotyping.md`, `okf/safety/prompt-injection.md`.

---

## The 10 Checks

## Check 1 — No LinkedIn scraping or external social fetch
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** No code scrapes, crawls, or fetches data from LinkedIn or any social platform. Contact data comes only from VCF/QR/manual entry.
**Grep command:** `rg -n "linkedin\.com|scrape|crawler|puppeteer|playwright" src/`
**Blocking:** YES

## Check 2 — No automatic email or message sending (drafts only)
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** No code path sends email or messages. Follow-ups are saved as drafts and require explicit user action. No SMTP/mail transport is wired to any route.
**Grep command:** `rg -n "sendMail|nodemailer|smtp|sgMail|auto.?send|transporter\.send" src/`
**Blocking:** YES

## Check 3 — All AI outputs pass through Zod schema validation
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** Every LLM output is parsed by a Zod schema before any DB write. No raw `llmOutput` flows into a Prisma `create`/`update`.
**Grep command:** `rg -n "\.parse\(|\.safeParse\(" src/ai/` (then confirm each AI service calls one before persisting)
**Blocking:** YES

## Check 4 — `requiresUserReview: true` literal present in follow-up schema
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** `FollowUpOutputSchema` uses `z.literal(true)` (not `z.boolean()`) for `requiresUserReview`, so a draft can never be marked auto-sendable.
**Grep command:** `rg -n "requiresUserReview" src/ai/schemas/`
**Blocking:** YES

## Check 5 — No demographic inference in cultural notes
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** No prompt or output infers traits from nationality/ethnicity/religion/politics. Cultural notes are grounded only in explicit user-stated preference. (Manual review of `culturalNotes[]` content + verification.service.ts stereotype check.)
**Grep command:** `rg -n "because they are|as a .*they prefer|their culture means|people prefer|business culture requires" src/`
**Blocking:** YES

## Check 6 — Prompt injection structural separation
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** In every prompt template, user-provided content sits in a clearly delimited section separate from system instructions (e.g. fenced/labelled block). User input is never concatenated inline into instruction text. (Manual review; cross-check `okf/safety/prompt-injection.md`.)
**Grep command:** `rg -n "prompt|system|user.?content|\\$\\{" src/ai/prompts/` (then inspect each template for delimiting)
**Blocking:** YES

## Check 7 — No user PII hardcoded in components
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** No real email addresses, phone numbers, or contact PII are hardcoded in React components. Data flows from props/hooks/API, not literals. (Seed/demo data lives in the seed script, not components.)
**Grep command:** `rg -n "[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|\b\d{8,}\b" src/components/`
**Blocking:** YES

## Check 8 — `AgentRun` record created for every AI call
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** Every service function that calls the LLM creates an `AgentRun` record (audit trail). No AI generation runs without a logged run.
**Grep command:** `rg -n "agentRun|AgentRun" src/services/` (then confirm each AI-calling service writes one)
**Blocking:** YES

## Check 9 — `verification.service.ts` runs on every AI output before save
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** Briefing/ranking/follow-up outputs pass through `verification.service.ts` (overconfidence + stereotype check) before being saved as a draft.
**Grep command:** `rg -n "verification\.service|verifyOutput|verifyBriefing|verify\(" src/services/`
**Blocking:** YES

## Check 10 — `npx tsc --noEmit` exits 0
**Status:** PASS / FAIL / NOT APPLICABLE
**What to verify:** Type check passes with zero errors on the PR branch.
**Command:** `npx tsc --noEmit`
**Blocking:** YES

---

## Review Comment Templates

### BLOCKER

```
## 🚨 BLOCKER — [Check name]
**File:** path/to/file.ts:line
**Issue:** [what's wrong]
**Required fix:** [what must change]
**Do not merge until resolved.**
```

### WARNING

```
## ⚠️ WARNING — [Check name]
**File:** path/to/file.ts:line
**Issue:** [what's flagged]
**Recommendation:** [suggested improvement]
**Can merge with acknowledgement.**
```

---

## Forbidden Code Patterns

If a grep matches any of these, flag a BLOCKER. Each entry: pattern → remediation.

| # | Pattern (grep) | Why forbidden | Remediation |
|---|----------------|---------------|-------------|
| 1 | `rg -n "linkedin\.com" src/` | LinkedIn scraping/import | Remove. Use VCF/QR/manual contact entry only. |
| 2 | `rg -n "sendMail\|nodemailer\|sgMail\.send\|transporter\.send" src/` | Auto-send of email/message | Save as draft; require explicit user action to send. |
| 3 | `rg -n "requiresUserReview: z\.boolean\(\)" src/ai/` | Weak follow-up review flag | Change to `z.literal(true)`. |
| 4 | `rg -n "because they are\|as a .*they prefer\|people prefer" src/` | Demographic stereotyping in cultural notes | Ground in explicit user-stated preference only; let verification.service.ts reject. |
| 5 | `rg -n "prisma\.\w+\.(create\|update)\(\{ data: \w*[lL]lm" src/` | Raw LLM output written to DB without Zod | Run `Schema.parse()` first; persist only validated object. |
| 6 | `rg -n "data: \{[^}]*(religion\|ethnicity\|politics)" src/` | Storing inferred demographic identity as a DB fact | Never persist inferred identity. Drop the field. |
| 7 | `rg -n "\\$\\{.*user.*\\}" src/ai/prompts/` | User input concatenated inline into a prompt | Move user content into a separate delimited section. |

---

## How To Use This Checklist

Run this on every PR labelled `status:review` (and always on any `priority:p0` issue).

1. **Clone the PR branch:**
   `gh pr checkout <PR-number>` (or `git fetch origin <branch> && git checkout <branch>`).
2. **Run each grep command** in Checks 1–9. Record the result as PASS / FAIL / NOT APPLICABLE.
   - A grep hit is not always a violation — inspect each match in context before deciding.
3. **Run the build checks:**
   - `npx tsc --noEmit` (Check 10 — must exit 0)
   - `npm run lint` (must exit 0)
   - `npx prisma validate` on schema changes
4. **For manual checks (5, 6, 9):** read the relevant prompt/service files and confirm the
   structural requirement, cross-referencing `okf/safety/`.
5. **Record PASS/FAIL** for each of the 10 checks in the PR review comment.
6. **Post comments:**
   - Any FAIL on a Blocking: YES check → post a **BLOCKER** comment (template above) and set verdict BLOCKED.
   - Lower-severity concerns → post a **WARNING** comment.
7. **Verdict:** PASS only when all 10 checks are PASS/NOT APPLICABLE and `tsc`/`lint` exit 0.
8. **After fixes:** re-run the failed checks to verify resolution, then move the issue to `status:done`.
9. **New violation pattern found?** Add it to *Forbidden Code Patterns* above and document it in `okf/safety/`.

---

## Findings Log

| Date | Issue # | Finding | Severity | Status |
|------|---------|---------|----------|--------|
| 2026-06-27 | — | Checklist infrastructure established — no PR findings yet | — | — |
