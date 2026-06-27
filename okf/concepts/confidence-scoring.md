# Concept: Confidence Scoring

## Purpose
Confidence scores reflect how reliable an AI-generated output is, based on the quality and completeness of input data. They are shown to users so they know when to trust and when to verify.

## Confidence in Briefings (0–100)

| Score | Meaning |
|-------|---------|
| 80–100 | Rich contact data: full name, title, company, LinkedIn, notes, prior interaction |
| 60–79 | Good data: name, title, company, some notes |
| 40–59 | Sparse: name and company only, no notes |
| 20–39 | Very sparse: name only or OCR with low quality |
| 0–19 | Almost no data — briefing is largely speculative |

Factors that raise confidence:
- Multiple populated contact fields
- User-written meeting notes
- Prior interaction record
- High `sourceConfidence` on ContactImport

Factors that lower confidence:
- Low `sourceConfidence` (OCR, screenshot)
- Missing title or company
- No notes or interaction history
- Conflicting data between fields

## Confidence in Rankings (0–1)

The `confidence` field on `RankingItem` reflects how well-supported that contact's rank is:

- `0.9–1.0`: Multiple data points all align with the goal
- `0.7–0.89`: Most data aligns; minor gaps
- `0.5–0.69`: Partial data; rank is tentative
- `<0.5`: Very sparse data; rank is speculative

## Displaying Confidence to Users

- Show confidence as a percentage or colour indicator (green/yellow/red)
- Always include a tooltip: "Confidence reflects how much data we have about this person."
- Do not hide low-confidence outputs — show them with the caveat
- Let users correct or augment contact data to improve confidence

## What Confidence Does NOT Mean

Confidence does not measure:
- How important the person is
- Whether the user should contact them
- The quality of the networking opportunity

It measures only the reliability of the AI output given available data.
