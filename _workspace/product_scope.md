# Lodestar — Product Scope

**Last updated:** 2026-06-27
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
5. **Click** "Generate Intro (Japanese)" → localised contact card appears
6. **Type** meeting note: "Agreed to share deck, follow up by Friday"
7. **Click** "Draft Follow-Up" → draft email appears instantly
8. **Show** draft has subject, body, status "Draft — Review Before Sending"

Demo line: *"Before Lodestar, you leave events with a list of names. After Lodestar, you leave with ranked opportunities and next actions."*

---

## Required Pages (MVP)

| Page | Path | Status |
|------|------|--------|
| Landing | `/` | To build |
| Onboarding | `/onboarding` | To build |
| Dashboard | `/dashboard` | To build |
| Event | `/events/[eventId]` | To build |
| Contact | `/contacts/[contactId]` | To build |
| Ranking | `/rankings/[rankingId]` | To build |

---

## Approved Features (MVP)

- User profile creation (onboarding)
- Event creation and selection
- Manual contact entry
- Contact ranking (deterministic scoring + optional LLM)
- Contact briefing generation (mock AI first)
- Cultural/language intro generation (cautious, stated preferences only)
- Meeting note entry
- Follow-up draft generation (never auto-send)
- Duplicate detection (identity resolution)
- Demo seed data (Alex Tan + Sup Build2026 + 6 contacts)

---

## Deferred (Not MVP)

| Feature | Reason deferred |
|---------|----------------|
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
