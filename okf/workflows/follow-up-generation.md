# Workflow: Follow-Up Draft Generation

## Purpose
Generate a personalised follow-up message draft based on meeting notes and contact context. Always a draft — never sent automatically.

## Inputs
- User's meeting notes (from `Interaction.userNotes`)
- Contact profile fields
- User profile (tone preference, name, company)
- Event context

## Process

1. **Load context** — interaction notes, contact, user profile from MySQL
2. **Build prompt** — include tone preference, contact name/title, and explicit instruction that output is a draft
3. **Call LLM client** — with `FollowUpOutputSchema`
4. **Zod validate** — `FollowUpOutputSchema.parse()` — this enforces `requiresUserReview: true`
5. **Save** — create `FollowUp` record with `status: "drafted"`, `userApproved: false`
6. **Log** — complete `AgentRun` record

## Output Fields (FollowUpOutputSchema)
- `subject`: email subject line
- `draftText`: the full message body (respectful, professional, personalised)
- `recommendedTiming`: when to send (e.g., "within 24 hours", "by end of week")
- `reasoning`: why this content and timing was suggested
- `confidence`: 0-1
- `requiresUserReview`: **always `true`** — enforced by `z.literal(true)` in Zod schema

## Safety Requirements
- The follow-up is ONLY ever saved as `status: "drafted"`, `userApproved: false`
- No code path sends the follow-up externally — ever
- The UI must display status "Draft — Review Before Sending"
- If meeting notes are very sparse, generate a minimal check-in draft with low confidence

## What NOT To Do
- Do not auto-send under any condition
- Do not set `userApproved: true` without explicit user action
- Do not include personal/sensitive details the user did not write in their notes
- Do not generate follow-ups for contacts the user does not own
