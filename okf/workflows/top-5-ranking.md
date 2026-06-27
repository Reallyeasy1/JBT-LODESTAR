# Workflow: Top-5 Contact Ranking

## Purpose
Rank all contacts in an event by their relevance to the user's networking goal, using a deterministic scoring model with optional LLM-generated reasoning.

## Inputs
- User's event goal text
- All contacts in the event (with all available fields)
- User profile (for context matching)

## Process

1. **Load contacts** — fetch all contacts for the event from MySQL
2. **Score each contact** — apply `ContactScoreBreakdown` model (see `concepts/opportunity-scoring.md`)
3. **Sum scores** — total out of 100
4. **Sort** — descending by total score
5. **Optional LLM** — if LLM is enabled, generate `reasoning` and `nextAction` text per contact
6. **Zod validate** — parse through `RankingOutputSchema`
7. **Save** — create `Ranking` record and one `RankingItem` per ranked contact
8. **Log** — complete `AgentRun` record

## Output Fields (RankingOutputSchema)
- `goal`: the goal text used for this ranking
- `rankedContacts[]`:
  - `contactId`
  - `rank`: 1-based position
  - `score`: 0-100 total score
  - `opportunityType`: investor / customer / collaborator / mentor / hire / recruiter / friend / other
  - `reasoning`: why this person ranks here (from LLM or template if mock)
  - `nextAction`: specific recommended next step
  - `confidence`: 0-1 (lower if data is sparse)
  - `evidence[]`: which contact fields drove the score

## Ranking Rules
- A high title without goal relevance → do NOT rank highly
- Notes with a clear next action → boost `followupClarity` dimension
- Weak or missing data → lower `confidence`, not necessarily lower rank
- Contacts must be ranked relative to the specific goal text, not general prestige

## What NOT To Do
- Do not rank contacts by LinkedIn followers, company size, or prestige alone
- Do not infer the contact's value from their nationality or alma mater
- Do not save ranking without Zod validation
- Do not run ranking for a userId that doesn't own the event
