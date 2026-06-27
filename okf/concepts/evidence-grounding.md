# Concept: Evidence Grounding

## Purpose
All AI outputs — briefings, rankings, cultural notes — must be grounded in explicit evidence from the contact's data. Claims without evidence must be flagged as uncertain or removed.

## What Counts as Evidence

| Evidence type | Source field | Weight |
|--------------|-------------|--------|
| Job title | `Contact.title` | High |
| Company and industry | `Contact.company` | High |
| User meeting notes | `Interaction.userNotes` | High |
| Stated language preference | `Contact.languages` | High |
| LinkedIn URL (existence) | `Contact.linkedinUrl` | Medium |
| Email domain | `Contact.email` | Low–Medium |
| Source confidence | `ContactImport.sourceConfidence` | Modifier |
| Tags | `Contact.tags` | Medium |
| Website | `Contact.websiteUrl` | Low |

## Evidence in `RankingItem`

The `evidence[]` field in `RankingOutputSchema` must list which contact data fields drove the score. Example:

```json
{
  "contactId": "...",
  "rank": 1,
  "score": 78,
  "evidence": [
    "title: 'Partner, Seed Ventures' — strong goalMatch for investor goal",
    "userNotes: 'interested in our demo, wants deck by Friday' — high followupClarity",
    "company: 'Seed Ventures' — industry fit: venture capital"
  ]
}
```

## Ungrounded Claims

If an AI output makes a claim that cannot be traced to a contact field, it is ungrounded.

Examples of ungrounded claims (must be flagged by verification.service.ts):
- "Sarah is likely an introvert." ← no personality data
- "Daniel prefers formal communication." ← no stated preference
- "Mei is probably familiar with agile methods." ← inferred from job title without explicit data

The verification service must add a warning to the `warnings[]` array for each ungrounded claim found.

## Grounding Threshold

For briefings: at least 3 evidence items should be traceable before generating substantive content. If fewer than 3, set `confidenceScore < 50` and add a warning: "Limited data available — review before using."

For rankings: if a contact has fewer than 2 populated fields, their `confidence` should be ≤ 0.4.
