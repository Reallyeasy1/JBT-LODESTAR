# Issue Backlog — First Vertical Slice

**Owner:** product-architect + lodestar-orchestrator
**Last updated:** 2026-06-27
**Status:** Drafts — see `_workspace/github_commands.md` to create on GitHub

---

## Issue #1 — Define MVP product scope and demo script

**Title:** Define MVP product scope and demo script

**Goal:** Produce a clear, written product scope and 30-second demo script that all agents use as their definition of done.

**Context:** The product requirements exist in PROJECT_REQUIREMENTS.md but a distilled, agent-readable scope doc and demo script are needed to align work across the team.

**Scope:**
- Update `_workspace/product_scope.md` with demo script, feature cut list, and approved MVP boundaries
- Verify 30-second demo path is walkable on paper

**Files likely touched:**
- `_workspace/product_scope.md`

**Acceptance criteria:**
- [ ] `_workspace/product_scope.md` contains a step-by-step 30-second demo script
- [ ] Feature cut list documents what is permanently forbidden vs deferred
- [ ] Every item in the MVP feature list maps to at least one issue in this backlog
- [ ] No approved feature requires a forbidden technology

**Test plan:** Read `_workspace/product_scope.md` and verify the demo script matches the demo flow in PROJECT_REQUIREMENTS.md.

**Dependencies:** None

**Labels:** `area:docs`, `agent:product-architect`, `priority:p0`, `size:s`, `parallel-safe`, `status:ready`

**Suggested agent:** product-architect

---

## Issue #2 — Create Prisma MySQL schema and seed data

**Title:** Create Prisma MySQL schema and seed data

**Goal:** Establish the MySQL source of truth with all required models, relations, indexes, and a demo-ready seed dataset.

**Context:** The schema is defined in PROJECT_REQUIREMENTS.md. This issue translates it into `prisma/schema.prisma`, runs the migration, and creates the seed script with 1 user, 1 event, and 6 contacts (including 1 intentional duplicate).

**Scope:**
- Create `prisma/schema.prisma` with all 13 models from PROJECT_REQUIREMENTS.md
- Run `npx prisma migrate dev --name init`
- Create `prisma/seed.ts` with demo data for Alex Tan + Sup Build2026 + 6 contacts
- Create `src/lib/db.ts` (singleton Prisma client)
- Verify `npx prisma db seed` runs clean

**Files likely touched:**
- `prisma/schema.prisma`
- `prisma/migrations/` (generated)
- `prisma/seed.ts`
- `src/lib/db.ts`
- `package.json` (add prisma seed script)

**Acceptance criteria:**
- [ ] `npx prisma migrate dev` exits 0
- [ ] `npx prisma db seed` exits 0 and is idempotent (safe to run twice)
- [ ] Seed creates Alex Tan user with profile
- [ ] Seed creates Sup Build2026 Hackathon event with goal text
- [ ] Seed creates 6 contacts: Sarah Tan, Daniel Wong, Mei Nakamura, Priya Menon, Sarah T. (duplicate), Aaron Lee
- [ ] Sarah Tan and Sarah T. have same company "Seed Ventures" — identity resolution should flag
- [ ] All contacts have title, company, email, and ranking-relevant notes populated
- [ ] `npx tsc --noEmit` exits 0 after schema generation

**Test plan:**
1. `npx prisma db push`
2. `npx prisma db seed`
3. `npx prisma studio` → verify all tables populated
4. Check contacts table for 6 rows

**Dependencies:** None (first issue to complete)

**Labels:** `area:data`, `agent:data-backend-engineer`, `priority:p0`, `size:m`, `needs-contract`, `status:ready`

**Suggested agent:** data-backend-engineer

---

## Issue #3 — Build seeded demo event dashboard

**Title:** Build seeded demo event dashboard (`/events/[eventId]`)

**Goal:** Create the event dashboard page showing goal, contacts list, and ranking trigger button.

**Context:** This is the primary entry point of the demo. After schema is seeded, this page should display the Sup Build2026 event with all 6 contacts and a "Rank Top Contacts" button.

**Scope:**
- `src/app/events/[eventId]/page.tsx`
- `src/components/events/EventDashboard.tsx`
- `src/components/contacts/ContactListItem.tsx`
- `src/app/api/events/[eventId]/route.ts`
- `src/app/api/contacts/route.ts`
- `src/lib/auth.ts` (getCurrentUser mock)

**Acceptance criteria:**
- [ ] `/events/[eventId]` loads with seeded event name and goal text
- [ ] Contact list shows all 6 seeded contacts with name, title, company
- [ ] "Rank Top Contacts" button is visible (links to ranking flow — can be placeholder)
- [ ] Page is usable at 375px mobile viewport
- [ ] No hardcoded data — all from MySQL via API route
- [ ] `getCurrentUser()` used for auth

**Test plan:**
1. Navigate to `/events/[demo-event-id]`
2. Verify event name "Sup Build2026 Hackathon" appears
3. Verify networking goal text appears
4. Verify 6 contacts listed
5. Verify mobile layout at 375px

**Dependencies:** Issue #2 (schema + seed must be complete)

**Labels:** `area:frontend`, `agent:fullstack-builder`, `priority:p0`, `size:m`, `blocked-by-schema`, `status:ready`

**Suggested agent:** fullstack-builder

---

## Issue #4 — Implement deterministic ranking service

**Title:** Implement deterministic contact ranking service

**Goal:** Build `ranking.service.ts` using the 9-dimension scoring model. Must produce ranked output without any LLM call.

**Context:** Ranking is the core AI feature of the demo. The deterministic model uses the ContactScoreBreakdown type defined in PROJECT_REQUIREMENTS.md. LLM is optional for reasoning text only.

**Scope:**
- `src/services/ranking.service.ts`
- `src/ai/schemas/ranking.schema.ts` (RankingOutputSchema Zod schema)
- `src/app/api/rankings/route.ts`
- `src/services/agent-run.service.ts` (if not already done in Issue #2)

**Acceptance criteria:**
- [ ] `rankContacts()` returns a valid `RankingOutputSchema` object without LLM
- [ ] Sarah Tan (investor) ranks higher than Priya Menon (recruiter) for goal "Find investors"
- [ ] Score breakdown covers all 9 dimensions totalling 0-100
- [ ] `POST /api/rankings` creates a `Ranking` record and `RankingItem` records in MySQL
- [ ] `AgentRun` record created for each ranking call
- [ ] `npx tsc --noEmit` exits 0

**Test plan:**
1. Call `POST /api/rankings` with demo event ID and goal "Find investors, pilot customers, and AI/backend collaborators"
2. Verify response contains 5+ ranked contacts
3. Verify Sarah Tan score > Priya Menon score
4. Verify Ranking and RankingItem rows in DB

**Dependencies:** Issue #2 (schema)

**Labels:** `area:ai`, `area:backend`, `agent:ai-workflow-engineer`, `priority:p0`, `size:m`, `blocked-by-schema`, `status:ready`

**Suggested agent:** ai-workflow-engineer

---

## Issue #5 — Build ranking UI

**Title:** Build ranking results page (`/rankings/[rankingId]`)

**Goal:** Display the ranked contact list with score, opportunity type, reasoning, next action, and confidence.

**Context:** After the "Rank Top Contacts" button is clicked, the user is redirected here to see their top contacts for the event goal.

**Scope:**
- `src/app/rankings/[rankingId]/page.tsx`
- `src/components/rankings/RankedContactCard.tsx`
- `src/app/api/rankings/[rankingId]/route.ts`

**Acceptance criteria:**
- [ ] `/rankings/[rankingId]` loads with goal text displayed
- [ ] Ranked contacts show: rank number, name, score, opportunity type, reasoning, next action, confidence
- [ ] Contacts link to `/contacts/[contactId]`
- [ ] Mobile layout correct at 375px
- [ ] All data from MySQL — no hardcoded content

**Dependencies:** Issues #2 + #4 (schema + ranking service + API route)

**Labels:** `area:frontend`, `agent:fullstack-builder`, `priority:p0`, `size:m`, `blocked-by-api`, `status:ready`

**Suggested agent:** fullstack-builder

---

## Issue #6 — Implement contact briefing mock service

**Title:** Implement contact briefing generation service (mock AI)

**Goal:** Build `briefing.service.ts` with mock LLM output. Real provider can be swapped in later.

**Context:** The briefing appears on the contact detail page. The mock should return plausible structured briefing data matching `BriefingOutputSchema`. The demo must work without API keys.

**Scope:**
- `src/ai/client.ts` (LLM provider abstraction + mock)
- `src/ai/schemas/briefing.schema.ts`
- `src/ai/prompts/briefing.ts`
- `src/services/briefing.service.ts`
- `src/services/verification.service.ts` (deterministic checks)
- `src/app/api/briefings/route.ts`

**Acceptance criteria:**
- [ ] `generateBriefing()` returns valid `BriefingOutputSchema` object
- [ ] Mock returns plausible data: personSummary, whyTheyMatter, 3 talkingPoints, 2 questionsToAsk
- [ ] `verification.service.ts` adds a warning if output contains "Because they are [X]"
- [ ] `Briefing` record saved to MySQL
- [ ] `AgentRun` record created
- [ ] Works without any API key or env var set

**Dependencies:** Issue #2 (schema)

**Labels:** `area:ai`, `agent:ai-workflow-engineer`, `priority:p0`, `size:s`, `parallel-safe`, `status:ready`

**Suggested agent:** ai-workflow-engineer

---

## Issue #7 — Build contact detail and briefing page

**Title:** Build contact detail page with briefing and follow-up (`/contacts/[contactId]`)

**Goal:** Display full contact profile, AI briefing, cultural notes, interaction notes, and follow-up draft button.

**Scope:**
- `src/app/contacts/[contactId]/page.tsx`
- `src/components/contacts/ContactProfile.tsx`
- `src/components/briefings/BriefingCard.tsx`
- `src/components/followups/FollowUpDraftButton.tsx`
- `src/app/api/contacts/[contactId]/route.ts`
- `src/app/api/briefings/route.ts` (GET for existing briefing)

**Acceptance criteria:**
- [ ] Page loads with contact name, title, company, source, confidence
- [ ] Briefing section shows: personSummary, whyTheyMatter, talkingPoints[], questionsToAsk[]
- [ ] Cultural notes section shows cultural notes with uncertainty language
- [ ] "Generate Briefing" button triggers `POST /api/briefings` if no briefing exists
- [ ] "Generate Intro (Japanese)" button triggers `POST /api/localisations` (Issue #13); shows returned opener text
- [ ] "Add Meeting Note" textarea saves to Interaction
- [ ] "Draft Follow-Up" button visible (can be placeholder linking to Issue #8 work)
- [ ] Mobile layout correct at 375px

**Dependencies:** Issues #2 + #6 (schema + briefing service) + #13 (localisation service)

**Labels:** `area:frontend`, `agent:fullstack-builder`, `priority:p0`, `size:m`, `blocked-by-api`, `status:ready`

**Suggested agent:** fullstack-builder

---

## Issue #8 — Implement follow-up draft service

**Title:** Implement follow-up draft generation service

**Goal:** Build `followup.service.ts` that generates a draft email from meeting notes. Always saves as draft, never sends.

**Scope:**
- `src/ai/schemas/followup.schema.ts`
- `src/ai/prompts/followup.ts`
- `src/services/followup.service.ts`
- `src/app/api/followups/route.ts`

**Acceptance criteria:**
- [ ] `generateFollowUp()` returns valid `FollowUpOutputSchema`
- [ ] `requiresUserReview` field is `z.literal(true)` in schema — always true
- [ ] `FollowUp` record saved with `status: "drafted"`, `userApproved: false`
- [ ] `AgentRun` record created
- [ ] No code path sends the draft externally
- [ ] Works with mock AI (no API key needed)

**Dependencies:** Issue #2 (schema)

**Labels:** `area:ai`, `agent:ai-workflow-engineer`, `priority:p0`, `size:s`, `parallel-safe`, `status:ready`

**Suggested agent:** ai-workflow-engineer

---

## Issue #9 — Add OKF starter knowledge bundle

**Title:** Add OKF starter knowledge bundle files

**Goal:** Create all OKF markdown files with initial content. These are used by AI services as durable policy context.

**Scope:**
- `okf/index.md`
- `okf/log.md`
- `okf/workflows/contact-capture.md`
- `okf/workflows/briefing-generation.md`
- `okf/workflows/top-5-ranking.md`
- `okf/workflows/follow-up-generation.md`
- `okf/concepts/opportunity-scoring.md`
- `okf/concepts/cultural-awareness.md`
- `okf/concepts/confidence-scoring.md`
- `okf/concepts/evidence-grounding.md`
- `okf/safety/privacy-and-consent.md`
- `okf/safety/prompt-injection.md`
- `okf/safety/anti-stereotyping.md`

**Acceptance criteria:**
- [ ] All 13 OKF files exist with substantive content
- [ ] No OKF file contains: contact names, emails, phone numbers, uploaded content, agent run logs
- [ ] `okf/safety/anti-stereotyping.md` includes the allowed/forbidden examples from PROJECT_REQUIREMENTS.md
- [ ] `okf/concepts/opportunity-scoring.md` documents the full scoring model (9 dimensions)

**Dependencies:** None

**Labels:** `area:okf`, `area:docs`, `agent:ai-workflow-engineer`, `priority:p1`, `size:s`, `parallel-safe`, `status:ready`

**Suggested agent:** ai-workflow-engineer

---

## Issue #10 — Add QA and safety checklist infrastructure

**Title:** Add QA and safety review checklist

**Goal:** Establish `_workspace/qa_checklist.md` and `okf/safety/` as living safety documentation.

**Scope:**
- `_workspace/qa_checklist.md` (populate with full checklist)
- `okf/safety/privacy-and-consent.md`
- `okf/safety/anti-stereotyping.md`
- `okf/safety/prompt-injection.md`

**Acceptance criteria:**
- [ ] `_workspace/qa_checklist.md` contains all 10 safety checks from the safety-qa-engineer agent definition
- [ ] Forbidden code patterns are documented with examples
- [ ] Review comment template is included

**Dependencies:** None

**Labels:** `area:qa`, `area:safety`, `agent:safety-qa-engineer`, `priority:p0`, `size:s`, `parallel-safe`, `status:ready`

**Suggested agent:** safety-qa-engineer

---

## Issue #11 — Verify no LinkedIn scraping or automatic sending

**Title:** Verify codebase contains no LinkedIn scraping or automatic sending

**Goal:** After initial build, audit the entire codebase to confirm no forbidden patterns exist.

**Scope:** Codebase audit (read-only), update `_workspace/qa_checklist.md` with findings.

**Acceptance criteria:**
- [ ] `grep -r "linkedin" src/` returns no scraping or API fetch code
- [ ] `grep -r "sendMail\|sendgrid\|nodemailer" src/` returns no results
- [ ] `grep -r "requiresUserReview" src/services/followup.service.ts` returns `z.literal(true)`
- [ ] `_workspace/qa_checklist.md` updated with audit date and result

**Dependencies:** Ideally runs after Issues #4, #6, #8 are complete

**Labels:** `area:safety`, `agent:safety-qa-engineer`, `priority:p0`, `size:s`, `parallel-safe`, `status:ready`

**Suggested agent:** safety-qa-engineer

---

## Issue #12 — Polish 30-second demo flow

**Title:** Polish and verify 30-second demo flow end-to-end

**Goal:** Walk through the entire demo script and fix any broken steps, missing copy, or visual issues.

**Scope:**
- Fix any broken navigation between pages
- Add demo CTA on landing page
- Ensure seeded data produces compelling ranking and briefing outputs
- Update demo script in `_workspace/product_scope.md` if flow changed

**Acceptance criteria:**
- [ ] Landing page → Onboarding → Event Dashboard → Rank → Contact Detail → Follow-up draft works without errors
- [ ] Sarah Tan ranks #1 for goal "Find investors, pilot customers, and AI/backend collaborators"
- [ ] Briefing for Sarah Tan contains plausible content (not Lorem ipsum)
- [ ] Follow-up draft for Sarah Tan includes a subject and ≥2 paragraph body
- [ ] Demo can be completed in ≤30 seconds by a human clicking through

**Dependencies:** All p0 issues (#2–#8, #13) must be complete

**Labels:** `area:frontend`, `area:docs`, `agent:product-architect`, `agent:fullstack-builder`, `priority:p1`, `size:m`, `status:ready`

**Suggested agents:** product-architect (script) + fullstack-builder (fixes)

---

## Issue #13 — Implement localised intro / opener generation service

**Title:** Implement localised intro / opener generation service

**Goal:** Generate a short, culturally-sensitive opener/intro text from a contact's *stated* language preferences only. Used in the "Generate Intro (Japanese)" demo step.

**Context:** The demo shows a localised contact-card opener for Sarah Tan (who has Japanese listed as a preferred language). This must be strictly grounded in `Contact.languages` — never inferred from name, nationality, or company. The verification service (Issue #6) must run on every output to catch anti-stereotyping violations before saving.

**Scope:**
- `src/ai/schemas/localisation.schema.ts` (Zod schema: openerText, languageUsed, confidenceScore, warnings[])
- `src/ai/prompts/localisation.ts`
- `src/services/localisation.service.ts`
- `src/app/api/localisations/route.ts` (POST only)
- Reuse `src/services/verification.service.ts` from Issue #6 for pattern check

**Acceptance criteria:**
- [ ] `generateLocalisation()` returns a valid Zod-parsed output with `openerText` and `languageUsed`
- [ ] Uses only `Contact.languages` (stated preferences) — zero demographic inference
- [ ] `verification.service.ts` flags any "Because they are [X]" or "[Nationality] people" pattern, adds to `warnings[]`, and lowers `confidenceScore`
- [ ] `AgentRun` record created for every call
- [ ] Works with mock AI (no API key or env var needed)
- [ ] `npx tsc --noEmit` exits 0

**Test plan:**
1. Call `POST /api/localisations` with Sarah Tan's contact ID (languages: ["Japanese", "English"])
2. Verify response has `openerText` (non-empty) and `languageUsed: "Japanese"`
3. Manually inject "Because they are Japanese" into mock output — verify `warnings[]` is non-empty
4. Verify `AgentRun` row created in DB

**Dependencies:** Issue #2 (schema, Contact.languages field), Issue #6 (verification.service.ts)

**Labels:** `area:ai`, `agent:ai-workflow-engineer`, `priority:p0`, `size:s`, `parallel-safe`, `status:ready`

**Suggested agent:** ai-workflow-engineer
