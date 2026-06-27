# Concept: Opportunity Scoring

## The 9-Dimension Scoring Model

Each contact is scored against the user's event goal across 9 dimensions. Total score: 0–100.

```
goalMatch            0–25   Keyword and semantic overlap between contact's role/company and event goal
roleRelevance        0–15   Seniority and function match to what the goal requires
decisionInfluence    0–15   Can this person make or strongly influence a relevant decision?
companyIndustryFit   0–10   Does the contact's company/industry align with the event's industry?
sharedContext        0–10   Shared tags, past interactions, mutual connections, event history
followupClarity      0–10   Do user notes contain a specific next action? (boost if yes)
reciprocity          0–5    Did the contact show interest (positive interaction outcome)?
freshness            0–5    How recently was this contact added or interacted with?
evidenceConfidence   0–5    How many contact fields are populated? More data → higher confidence
```

## Scoring Intent

**goalMatch is weighted highest (25 points) by design.**
A VP at a company with no relevance to the goal should score lower than a junior person at a directly relevant company. Rank by fit, not by title or prestige.

**followupClarity rewards actionable notes.**
If the user wrote "Agreed to connect on a pilot in Q3 — she wants our deck," the follow-up action is clear. This should meaningfully boost the contact's score above one with equal fields but no notes.

**evidenceConfidence penalises sparse data, not the person.**
If a contact only has a name and company, their score is valid but carries uncertainty. The confidence field in `RankingOutputSchema` should reflect this.

## Scoring Rubric Examples

### goalMatch (0–25)
- 20–25: Contact's title/company directly matches goal keywords (e.g., "investor" in goal, contact is "Partner at VC firm")
- 10–19: Partial match (contact could plausibly be relevant)
- 0–9: Weak or no keyword connection

### decisionInfluence (0–15)
- 12–15: C-suite, Partner, VP, or explicit decision-maker signals
- 6–11: Director, Senior Manager, or implied influence
- 0–5: Individual contributor or unknown

### followupClarity (0–10)
- 8–10: Notes contain a specific, actionable next step with timeline
- 4–7: Notes mention interest or vague follow-up
- 0–3: No notes or notes are generic

## Opportunity Types

When assigning `opportunityType` to a ranked contact, use these categories:

| Type | When to use |
|------|------------|
| `investor` | VC, angel, family office, or explicit funding interest |
| `customer` | Potential buyer or pilot partner for the product |
| `collaborator` | Technical, operational, or business partner |
| `mentor` | Advisor, connector, or domain expert |
| `hire` | Potential team member |
| `recruiter` | Looking to place talent |
| `friend` | Genuine personal connection, no specific business goal |
| `other` | Doesn't fit above categories |

## What NOT To Do

- Do not rank a contact highly solely because of their employer brand
- Do not rank a contact higher because of their nationality, gender, or demographic signals
- Do not assign `opportunityType: "investor"` based on a company name alone — look for explicit signals
