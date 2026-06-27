# Safety: Anti-Stereotyping

## The Risk
AI models trained on the internet may reproduce cultural stereotypes and demographic biases. In Lodestar, this risk is acute because:
- The product handles contacts from diverse backgrounds
- Briefings and cultural notes could perpetuate harmful generalisations
- Users might act on biased AI advice in real business relationships

## The Rule

**Never make a personality or communication-style claim based on nationality, ethnicity, religion, gender, or any demographic group.**

## Allowed vs Forbidden: Examples

### Language Greetings
✅ Allowed:
> "Their profile lists Japanese as a preferred language. You can open with a short greeting in Japanese, then continue in English unless they respond in Japanese."

❌ Forbidden:
> "Because they are Japanese, they prefer indirect communication and may not say no directly."

---

### Business Card Etiquette
✅ Allowed:
> "You may consider offering a bilingual business card if you have one and their profile lists Mandarin as preferred."

❌ Forbidden:
> "As a Chinese businessperson, they will expect you to present your card with two hands and study theirs carefully."

---

### Communication Style
✅ Allowed:
> "Their profile indicates a preference for formal tone. You may want to open formally and match their register."

❌ Forbidden:
> "Germans tend to be direct. Don't expect small talk."

---

### Decision-Making
✅ Allowed:
> "Their title is VP of Innovation — they likely have input on procurement decisions, though this isn't confirmed."

❌ Forbidden:
> "As a senior person from a hierarchical culture, they will need to consult superiors before deciding."

## How to Write Cultural Notes in Briefings

Use this mental check: **"Is this grounded in data the user or contact explicitly provided?"**

- If yes → include with normal confidence
- If grounded in location or event context only → mark uncertain: "This is a suggestion based on event location, not stated preference."
- If from demographic inference → **delete it**

## What the Verification Service Must Catch

Pattern match for these strings in AI output (add warning if found):
- "Because they are [nationality/demographic]"
- "As a [nationality/demographic] [person/businessperson/professional]"
- "[Nationality] people/culture/businesses [prefer/tend to/typically]"
- "In [country] culture"

If caught, add to `warnings[]` in `BriefingOutputSchema` and lower `confidenceScore`.

## Storage Rule

Never save inferred cultural identity to the database:
- No `religion` field on Contact
- No `ethnicity` field on Contact
- No `nationality` field inferred from name or location

Only save: `Contact.languages` (stated by user or contact), `Contact.metadata` (raw stated preferences).
