# Lodestar — Product Scope

**Last updated:** 2026-06-27 (scope audit)
**Owner:** product-architect

---

## Core Promise

> Lodestar turns every event contact into a ranked next action.

Tagline: **Scan the room. Know who matters. Follow up before the opportunity goes cold.**

---

## The Wedge

**User problem in one sentence:**
"I met 40 people at a conference. Which 5 actually matter for what I'm trying to achieve, and what do I do about them?"

Every feature must serve this wedge or be cut.

---

## MVP Vertical Slice (Priority 1)

```
Demo user (Alex Tan)
→ Opens event dashboard (Sup Build2026 Hackathon)
→ Sees networking goal + 6 seeded contacts
→ Clicks "Rank Top Contacts"
→ Sees top 5 ranked with: score, opportunity type, reasoning, next action, confidence
→ Clicks top contact (Sarah Tan — investor)
→ Sees briefing: summary, why they matter, talking points, questions to ask, cultural notes
→ Clicks "Generate Localised Intro" → gets contact-card intro text
→ Types a meeting note
→ Clicks "Draft Follow-Up"
→ Sees follow-up draft: subject + body, status "Draft — Review Before Sending"
```

---

## 30-Second Demo Script

1. **Open** `/events/[eventId]` → event name, goal text, 6 contacts visible
2. **Click** "Rank Top Contacts" → wait 1-2s → top 5 appear with scores
3. **Click** Sarah Tan (rank #1, investor) → contact detail page
4. **Scroll** briefing section → summary, why she matters, 3 talking points
5. **Click** "Generate Intro (Japanese)" → localised opener text appears (Issue #13)
6. **Type** meeting note: "Agreed to share deck, follow up by Friday"
7. **Click** "Draft Follow-Up" → draft email appears instantly
8. **Show** draft has subject, body, status "Draft — Review Before Sending"

Demo line: *"Before Lodestar, you leave events with a list of names. After Lodestar, you leave with ranked opportunities and next actions."*

---

## Required Pages (MVP)

| Page | Path | Status |
|------|------|--------|
| Landing | `/` | To build — minimal CTA pointing to demo event (Issue #12) |
| Event | `/events/[eventId]` | To build (Issue #3) |
| Contact | `/contacts/[contactId]` | To build (Issue #7) |
| Ranking | `/rankings/[rankingId]` | To build (Issue #5) |

**Deferred pages** (not in demo vertical slice):
- `/onboarding` — demo uses mock `getCurrentUser()` + seed data, no onboarding flow needed
- `/dashboard` — demo opens straight to `/events/[eventId]`, no event-selector needed

---

## Approved Features (MVP)

The following features appear in the demo vertical slice and each has a backing issue:

| Feature | Issue | Notes |
|---------|-------|-------|
| Contact ranking (deterministic scoring + optional LLM reasoning) | #4 | Core wedge |
| Contact briefing generation (mock AI first) | #6 | Includes cultural notes |
| Localised intro / opener generation (stated preferences only) | #13 | Anti-stereotyping enforced |
| Meeting note entry | #7 | Saves to Interaction table |
| Follow-up draft generation (never auto-send) | #8 | `requiresUserReview: true` always |
| Demo seed data (Alex Tan + Sup Build2026 + 6 contacts) | #2 | Includes intentional duplicate |
| OKF knowledge bundle | #9 | Durable AI policy files |
| QA + safety checklist infrastructure | #10 | Agent-facing review gate |

**Backend-only (not demo-surfaced, but present in seed):**
- Duplicate detection / identity resolution — Sarah Tan / Sarah T. are seeded as near-duplicates (same company "Seed Ventures"). The backend notes the match; no UI surfaces it in MVP.

---

## Deferred (Not MVP)

| Feature | Reason deferred |
|---------|----------------|
| User profile creation / onboarding | Demo uses mock `getCurrentUser()` + seed; no p0 issue; not in demo path |
| Event creation and selection | Demo uses single seeded event; not in demo path |
| Manual contact entry | Demo uses 6 seeded contacts; not in demo path |
| VCF / QR import | After core flow ships |
| OCR business card | After core flow ships |
| Real LLM provider | After mock demo works |
| Auth (Clerk/Auth.js) | After mock auth demo works |
| File upload (S3/R2) | After local works |
| CRM sync | Post-MVP |
| NFC | Post-MVP |
| Native mobile | Post-MVP |
| LinkedIn scraping | **Permanently forbidden** |
| Automatic sending | **Permanently forbidden** |
| Autonomous agent loops | **Permanently forbidden** |

---

## Feature Cut Log

| Feature | Cut date | Reason |
|---------|----------|--------|
| PostgreSQL | 2026-06-27 | MySQL only per requirements |
| pgvector | 2026-06-27 | No vector DB in initial scaffold |
| Graph database | 2026-06-27 | No graph DB per requirements |
| User profile creation / onboarding | 2026-06-27 | Not in demo vertical slice; demo uses mock auth + seed data |
| Event creation and selection | 2026-06-27 | Not in demo vertical slice; demo uses single seeded event |
| Manual contact entry | 2026-06-27 | Not in demo vertical slice; demo uses 6 seeded contacts |
| `/onboarding` page | 2026-06-27 | Not in demo path; deferred until post-MVP |
| `/dashboard` page | 2026-06-27 | Not in demo path; demo opens directly to `/events/[eventId]` |
