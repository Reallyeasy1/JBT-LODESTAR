# Lodestar — Technical Plan

**Last updated:** 2026-06-27
**Owner:** lodestar-orchestrator (maintained by data-backend-engineer + ai-workflow-engineer contributions)

---

## Stack (locked — do not change without orchestrator approval)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js App Router (TypeScript) |
| Styling | Tailwind CSS |
| Database | MySQL |
| ORM | Prisma |
| Auth | Mock getCurrentUser() → prepare for Clerk/Auth.js |
| AI | Provider abstraction in src/ai/client.ts (mock default) |
| Validation | Zod for all AI outputs |
| Deploy target | Vercel-compatible |

---

## Data Schema Summary

See `prisma/schema.prisma` for authoritative definitions.

### Core Models

| Model | Key fields | Relations |
|-------|-----------|-----------|
| User | id, email, name, authProvider | profile, events, contacts, agentRuns |
| UserProfile | userId, displayName, title, company, languages(Json), networkingGoals(Json) | user |
| Event | userId, name, location, startDate, eventGoal, industry | user, contacts, rankings |
| Contact | userId, eventId, fullName, title, company, email, linkedinUrl, sourceType | user, event, briefings, rankingItems, followUps |
| Briefing | userId, contactId, personSummary, talkingPoints(Json), confidenceScore | contact |
| Ranking | userId, eventId, goalText | event, items |
| RankingItem | rankingId, contactId, rankPosition, score, opportunityType, reasoning | ranking, contact |
| FollowUp | userId, contactId, subject, draftText, status, userApproved | contact |
| AgentRun | userId, taskType, agentType, inputJson, outputJson, status, latencyMs | user, toolCalls |
| AuditLog | userId, entityType, entityId, action, oldValue, newValue | user |

### ID Convention
All IDs: `String @id @default(uuid())`

### JSON Fields
Used for: evidence, warnings, metadata, tags, languages, networkingGoals, talkingPoints, questionsToAsk, culturalNotes

---

## Service Function Contracts

### identity-resolution.service.ts
```ts
resolveContact(input: ContactInput, userId: string): Promise<{
  result: "duplicate" | "possible-duplicate" | "new";
  existingContactId?: string;
  confidence: number;
}>
```

### ranking.service.ts
```ts
rankContacts(eventId: string, goalText: string, userId: string): Promise<{
  ranking: Ranking;
  items: RankingItem[];
}>
// Must work without LLM. Uses ContactScoreBreakdown model.
```

### briefing.service.ts
```ts
generateBriefing(contactId: string, userId: string): Promise<Briefing>
// Loads user profile + event + contact, generates via LLM client, verifies, saves
```

### followup.service.ts
```ts
generateFollowUp(params: {
  contactId: string;
  userId: string;
  interactionId?: string;
  meetingNote?: string;
}): Promise<{ followUp: FollowUp; output: FollowUpOutput }>
// Always saves status: "drafted", userApproved: false, requiresUserReview: true
```

### verification.service.ts
```ts
checkOutput(output: unknown, type: "briefing" | "ranking" | "followup"): {
  warnings: string[];
  blockers: string[];
}
```

### agent-run.service.ts
```ts
startAgentRun(params: StartAgentRunParams): Promise<string>   // returns agentRunId
completeAgentRun(agentRunId: string, params: CompleteAgentRunParams): Promise<void>
```

---

## API Route Map

| Method | Path | Service called | Auth |
|--------|------|---------------|------|
| POST/GET | /api/profile | UserProfile CRUD | getCurrentUser() |
| POST/GET | /api/events | Event CRUD | getCurrentUser() |
| GET | /api/events/:eventId | Event fetch | getCurrentUser() |
| POST/GET | /api/contacts | Contact CRUD | getCurrentUser() |
| GET | /api/contacts/:contactId | Contact fetch | getCurrentUser() |
| POST | /api/contact-imports | ContactImport + identity-resolution | getCurrentUser() |
| POST | /api/briefings | briefing.service | getCurrentUser() |
| GET | /api/briefings/:briefingId | Briefing fetch | getCurrentUser() |
| POST | /api/rankings | ranking.service | getCurrentUser() |
| GET | /api/rankings/:rankingId | Ranking + items fetch | getCurrentUser() |
| POST | /api/interactions | Interaction create | getCurrentUser() |
| POST | /api/followups | followup.service | getCurrentUser() |
| GET | /api/followups/:followupId | FollowUp fetch | getCurrentUser() |
| POST | /api/feedback | Feedback create | getCurrentUser() |

---

## Build Order (dependency-enforced)

1. Prisma schema + migration + seed
2. `src/lib/db.ts` (singleton Prisma client)
3. `src/lib/auth.ts` (getCurrentUser mock)
4. Service function stubs (identity-resolution, agent-run)
5. `src/ai/client.ts` + `src/ai/schemas/` (Zod schemas)
6. Ranking service (deterministic, no LLM)
7. Briefing service (mock AI)
8. API routes (call service functions)
9. Pages (call API routes)
10. Follow-up service
11. OKF files
12. Verification service
13. Real LLM provider (swap in after mock demo works)

---

## Phase Completion Status

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Repo init + harness setup | ✅ Done |
| 1 | Schema + seed + lib | ✅ Done via PR #17 |
| 2 | Service layer + AI stubs | In progress — #4 active, #6/#8 in review via PR #19 |
| 3 | API routes | Partial — briefing/follow-up routes in PR #19 |
| 4 | Pages + UI | Blocked by Phase 3 |
| 5 | Demo polish + QA | Blocked by Phase 4 |
