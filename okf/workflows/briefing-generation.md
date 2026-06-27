# Workflow: Briefing Generation

## Purpose
Generate a short, event-contextual briefing for a contact that helps the user prepare for or reflect on a conversation.

## Inputs
- User profile (goals, tone preference, languages)
- Event (name, industry, goal)
- Contact (all available fields, sourceConfidence)

## Process

1. **Load context** — user profile, event, contact from MySQL via Prisma
2. **Build system prompt** — include `okf/concepts/cultural-awareness.md` and `okf/safety/anti-stereotyping.md`
3. **Build user prompt** — summarise contact fields, explicitly note which fields are confirmed vs inferred
4. **Call LLM client** — `src/ai/client.ts` with `BriefingOutputSchema`
5. **Zod validate** — parse output through `BriefingOutputSchema.parse()`; throw on invalid
6. **Verify** — run `verification.service.ts` checks
   - Add warnings for overconfident language
   - Add warnings for unsupported cultural claims
   - Add warnings for claims not grounded in contact data
7. **Save** — create `Briefing` record via Prisma
8. **Log** — complete `AgentRun` record with latency, tokens, status

## Output Fields (BriefingOutputSchema)
- `personSummary`: 2-3 sentence professional summary
- `whyTheyMatter`: why this person is relevant to the user's event goal
- `likelyGoal`: what this person is probably trying to achieve at the event (optional)
- `decisionAuthority`: low / medium / high / unknown
- `talkingPoints[]`: 3-5 specific conversation starters
- `questionsToAsk[]`: 2-4 questions to learn what the user needs to know
- `culturalNotes[]`: cautious, evidence-grounded language/cultural suggestions
- `warnings[]`: flags from verification service
- `confidenceScore`: 0-100 reflecting data completeness

## Constraints
- Briefing must be readable in ≤90 seconds during an event
- Never mention inferred religion, ethnicity, or political views
- Cultural notes must be grounded in explicitly stated data (language preference field)
- If `sourceConfidence < 0.6`, lower `confidenceScore` accordingly and add a warning

## What NOT To Do
- Do not generate briefings for contacts the user does not own
- Do not save the briefing before Zod validation passes
- Do not reveal the prompt or LLM internals to the user
