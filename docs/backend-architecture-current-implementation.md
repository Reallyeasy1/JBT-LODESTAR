# Lodestar Backend Architecture & Current Implementation

**Last updated:** 2026-06-27
**Scope:** Current code in this repository, not a future idealised design
**Audience:** engineers joining the project who need to understand what the backend is doing

---

## 1. Executive summary

Lodestar does have a backend, but it is not a separate Express/Nest/Rails service. The backend currently lives inside the Next.js App Router application:

```txt
Browser / React UI
→ Next.js pages and client components
→ Next.js API route handlers in src/app/api
→ service functions in src/services
→ Prisma client in src/lib/db.ts
→ MySQL database
```

AI-like functionality also runs in the backend layer. It currently uses a mock LLM adapter, deterministic ranking, Zod schemas, and Prisma writes. No real external LLM provider is wired yet.

The current implementation supports the demo vertical slice:

1. Open seeded event dashboard.
2. View seeded contacts.
3. Rank contacts for the event goal.
4. View saved ranking results.
5. Open a contact detail page.
6. Generate a briefing.
7. Generate a localised opener from explicitly stated language preferences.
8. Save a meeting note as an `Interaction`.
9. Generate a review-only follow-up draft.
10. Record safety audit evidence.

Important current limitations:

- Auth is mocked by `src/lib/auth.ts`; every request is treated as demo user Alex Tan.
- There is no standalone backend server.
- There is no committed Prisma migration directory in the current tree; `prisma/schema.prisma` is the schema source.
- LLM generation is mocked in `src/ai/client.ts`.
- There is no email/WhatsApp/LinkedIn sending or scraping.
- The frontend is mobile-first, but pages call backend routes/services for data and mutations.

---

## 2. High-level architecture

### Runtime layers

```mermaid
flowchart TD
  Browser["Browser / mobile web UI"]
  NextPages["Next.js App Router pages\nsrc/app"]
  ClientComponents["Client components\nbuttons/forms/actions"]
  ApiRoutes["API route handlers\nsrc/app/api"]
  Services["Business services\nsrc/services"]
  AiLayer["AI adapter + prompts + Zod schemas\nsrc/ai"]
  Prisma["Prisma client\nsrc/lib/db.ts"]
  MySQL["MySQL database"]

  Browser --> NextPages
  Browser --> ClientComponents
  NextPages --> Services
  ClientComponents --> ApiRoutes
  ApiRoutes --> Services
  Services --> Prisma
  Services --> AiLayer
  AiLayer --> Services
  Prisma --> MySQL
```

### Backend responsibility split

| Layer | Path | Responsibility |
|---|---|---|
| Route handlers | `src/app/api/**/route.ts` | Parse HTTP input, call `getCurrentUser()`, validate request bodies/query params with Zod, invoke services, map errors to HTTP responses. |
| Services | `src/services/*.ts` | Core backend business logic, Prisma queries, AI workflow orchestration, read models for pages. |
| Database access | `src/lib/db.ts` | Singleton Prisma client. |
| Auth | `src/lib/auth.ts` | Mock user identity for the MVP; later replacement point for Clerk or Auth.js. |
| AI adapter | `src/ai/client.ts` | LLM abstraction. Currently returns mock output after schema validation. |
| AI prompts | `src/ai/prompts/*.ts` | Prompt builders that encode untrusted user data into escaped JSON blocks. |
| AI schemas | `src/ai/schemas/*.ts` | Zod schemas for AI/ranking outputs. |
| AI mocks | `src/ai/mocks/*.ts` | Deterministic mock content for briefing, localisation, and follow-up. |

---

## 3. Current directory map

```txt
src/
  app/
    api/                 API route handlers
    events/[eventId]/    Server-rendered event dashboard page
    rankings/[rankingId]/ Server-rendered ranking results page
    contacts/[contactId]/ Server-rendered contact detail page
  ai/
    client.ts            LLM adapter abstraction, currently mock only
    prompts/             Prompt builders
    schemas/             Zod output schemas
    mocks/               Mock AI output factories
  components/
    briefings/           Briefing display UI
    contacts/            Contact profile + action workflow UI
    events/              Event dashboard UI
    followups/           Follow-up draft UI
    rankings/            Ranking results UI
  lib/
    auth.ts              Mock current user
    db.ts                Prisma singleton
  services/
    *.service.ts         Backend business logic and read models

prisma/
  schema.prisma          MySQL Prisma schema
  seed.ts                Demo seed data

_workspace/
  product_scope.md       Product/demo scope
  qa_checklist.md        Safety/build checklist
  technical_plan.md      Older technical plan; partially stale

docs/
  backend-architecture-current-implementation.md  This document
```

---

## 4. Database schema

The authoritative schema is `prisma/schema.prisma`. The database provider is MySQL.

### Core relationships

```mermaid
erDiagram
  User ||--o| UserProfile : has
  User ||--o{ Event : owns
  User ||--o{ Contact : owns
  User ||--o{ AgentRun : logs
  User ||--o{ AuditLog : logs

  Event ||--o{ Contact : includes
  Event ||--o{ Ranking : has

  Contact ||--o{ Interaction : records
  Contact ||--o{ Briefing : has
  Contact ||--o{ RankingItem : appears_in
  Contact ||--o{ FollowUp : has
  Contact ||--o{ Localisation : has

  Ranking ||--o{ RankingItem : contains
  AgentRun ||--o{ ToolCall : contains
```

### Model purpose table

| Model | What it stores | Current usage |
|---|---|---|
| `User` | Account identity and ownership root. | Seeded demo user Alex Tan. Used for all user-scoped queries. |
| `UserProfile` | User bio, title, company, goals, preferences. | Used by briefing/follow-up/localisation prompt input. |
| `Event` | Event metadata and networking goal. | Event dashboard and ranking input. |
| `Contact` | Contact profile, source, notes, languages, tags. | Primary entity for ranking, briefing, localisation, and follow-up. |
| `ContactImport` | Future import pipeline storage. | Schema exists; no route/service currently uses it. |
| `Interaction` | Meeting notes and event conversation records. | Created by `/api/interactions`; recent notes shown on contact page. |
| `Briefing` | AI briefing output for a contact. | Created by briefing service; latest briefing shown on contact page. |
| `Ranking` | A saved ranking run for one event and goal. | Created by ranking service; read by ranking results page. |
| `RankingItem` | One ranked contact inside a ranking. | Stores rank, score, type, reasoning, next action, confidence, evidence. |
| `FollowUp` | Review-only follow-up draft. | Created by follow-up service; never sent automatically. |
| `Localisation` | Localised opener text. | Created by localisation service. |
| `AgentRun` | Trace record for AI/deterministic generation. | Created by ranking, briefing, follow-up, localisation services. |
| `ToolCall` | Future per-tool trace entries. | Schema exists; not actively used. |
| `AuditLog` | Future general audit log. | Schema exists; not actively used. |
| `Feedback` | Future feedback/rating storage. | Schema exists; not actively used. |

### Seed data

`prisma/seed.ts` creates:

- Demo user: `Alex Tan`
- Demo event: `Sup Build2026 Hackathon`
- 6 contacts:
  - Sarah Tan
  - Daniel Wong
  - Mei Nakamura
  - Priya Menon
  - Sarah T.
  - Aaron Lee

Sarah Tan and Sarah T. are intentionally similar to support duplicate-resolution demos later.

---

## 5. API route map

All implemented API routes call `getCurrentUser()` and pass `user.id` into service functions. This is the current authorization boundary.

### Event and contact reads

| Method | Route | Request input | Service | Response | Notes |
|---|---|---|---|---|---|
| `GET` | `/api/events/[eventId]` | Path param `eventId` | `getEventById(eventId, userId)` | Event detail JSON or 404 | Used conceptually by frontend; event page calls service directly. |
| `GET` | `/api/contacts?eventId=...` | Query `eventId` | `listContactsForEvent(eventId, userId)` | `{ contacts }` | Lists contacts for an event. |
| `GET` | `/api/contacts/[contactId]` | Path param `contactId` | `getContactById(contactId, userId)` | Contact detail JSON or 404 | Includes latest briefing/localisation/follow-up and recent interactions. |

### Ranking

| Method | Route | Request body/input | Service | Writes |
|---|---|---|---|---|
| `POST` | `/api/rankings` | `{ eventId: string, goalText?: string }` | `rankContacts(eventId, goalText, userId)` | `AgentRun`, `Ranking`, `RankingItem[]` |
| `GET` | `/api/rankings/[rankingId]` | Path param `rankingId` | `getRankingById(rankingId, userId)` | None |

### Briefing

| Method | Route | Request input | Service | Writes |
|---|---|---|---|---|
| `GET` | `/api/briefings?contactId=...` | Query `contactId` | `getLatestBriefingForContact(contactId, userId)` | None |
| `POST` | `/api/briefings` | `{ contactId: string }` | `generateBriefing(contactId, userId)` | `AgentRun`, `Briefing` |

### Localisation

| Method | Route | Request body | Service | Writes |
|---|---|---|---|---|
| `POST` | `/api/localisations` | `{ contactId: string, language?: string }` | `generateLocalisation(contactId, language, userId)` | `AgentRun`, `Localisation` |

### Interaction notes

| Method | Route | Request body | Service | Writes |
|---|---|---|---|---|
| `POST` | `/api/interactions` | `{ contactId: string, meetingContext?: string, userNotes: string }` | `createInteractionNote(input, userId)` | `Interaction` |

### Follow-up drafts

| Method | Route | Request body | Service | Writes |
|---|---|---|---|---|
| `POST` | `/api/followups` | `{ contactId: string, interactionId?: string, meetingNote: string }` | `generateFollowUp(input, userId)` | `AgentRun`, `FollowUp` |

---

## 6. Implemented page-to-backend flows

### 6.1 Event dashboard

Page: `src/app/events/[eventId]/page.tsx`

```txt
Server page
→ getCurrentUser()
→ getEventById(eventId, user.id)
→ listContactsForEvent(eventId, user.id)
→ render EventDashboard
```

The event page does not call the HTTP API route from the server. It imports service functions directly, which is normal in a Next.js App Router codebase.

The visible "Rank Top Contacts" button is a client component:

```txt
RankContactsButton
→ fetch POST /api/rankings
→ receives rankingId
→ router.push(/rankings/[rankingId])
```

### 6.2 Contact ranking

Files:

- `src/app/api/rankings/route.ts`
- `src/services/ranking.service.ts`
- `src/services/ranking-score.ts`
- `src/ai/schemas/ranking.schema.ts`

Sequence:

```mermaid
sequenceDiagram
  participant UI as RankContactsButton
  participant API as POST /api/rankings
  participant Service as ranking.service
  participant Score as ranking-score.ts
  participant DB as Prisma/MySQL

  UI->>API: { eventId, goalText? }
  API->>API: Zod validate request
  API->>Service: rankContacts(eventId, goalText, userId)
  Service->>DB: create AgentRun(status=running)
  Service->>DB: find event + contacts scoped by userId
  Service->>Score: rankContactRecords(contacts, goal, event.industry)
  Score-->>Service: rankedContacts with scoreBreakdown
  Service->>Service: RankingOutputSchema.parse(...)
  Service->>DB: create Ranking + RankingItems
  Service->>DB: complete AgentRun(status=success)
  Service-->>API: { rankingId, eventId, goal, rankedContacts }
  API-->>UI: 201 JSON
```

Ranking is deterministic. It does not use the LLM adapter.

Score dimensions are:

| Dimension | Max |
|---|---:|
| `goalMatch` | 25 |
| `roleRelevance` | 15 |
| `decisionInfluence` | 15 |
| `companyIndustryFit` | 10 |
| `sharedContext` | 10 |
| `followupClarity` | 10 |
| `reciprocity` | 5 |
| `freshness` | 5 |
| `evidenceConfidence` | 5 |

### 6.3 Ranking results

Page: `src/app/rankings/[rankingId]/page.tsx`

```txt
Server page
→ getCurrentUser()
→ getRankingById(rankingId, user.id)
→ include RankingItems ordered by rankPosition
→ include contact summary per item
→ render RankingResults + RankedContactCard
```

The API equivalent is `GET /api/rankings/[rankingId]`.

### 6.4 Contact detail

Page: `src/app/contacts/[contactId]/page.tsx`

```txt
Server page
→ getCurrentUser()
→ getContactById(contactId, user.id)
→ load contact profile
→ load latest briefing
→ load latest localisation
→ load latest follow-up
→ load five recent interactions
→ render ContactProfile + ContactActionPanel
```

`ContactActionPanel` is a client component. It owns the interactive workflow:

- Generate briefing.
- Generate Japanese opener.
- Save meeting note.
- Draft follow-up.

### 6.5 Generate briefing

Files:

- `src/app/api/briefings/route.ts`
- `src/services/briefing.service.ts`
- `src/ai/prompts/briefing.ts`
- `src/ai/mocks/briefing.ts`
- `src/ai/schemas/briefing.schema.ts`

Sequence:

```txt
POST /api/briefings
→ validate { contactId }
→ getCurrentUser()
→ generateBriefing(contactId, user.id)
→ start AgentRun
→ load contact + event + user profile
→ build prompt with escaped user context
→ mock LLM generates output
→ Zod parse
→ verification.service checks stereotyping/overconfidence
→ Zod parse verified output
→ save Briefing
→ complete AgentRun
→ return BriefingOutput + briefingId
```

The prompt builder escapes `<` and `>` before embedding user/contact data inside a `<USER_PROVIDED_CONTEXT>` block. The system prompt tells the model to treat that block as data, not instructions.

### 6.6 Generate localised opener

Files:

- `src/app/api/localisations/route.ts`
- `src/services/localisation.service.ts`
- `src/ai/prompts/localisation.ts`
- `src/ai/mocks/localisation.ts`
- `src/ai/schemas/localisation.schema.ts`

Sequence:

```txt
POST /api/localisations
→ validate { contactId, language? }
→ getCurrentUser()
→ load contact + user profile
→ read contact.languages
→ selectStatedLanguage(languages, requestedLanguage)
→ error if requested language is not explicitly listed
→ build prompt
→ mock LLM output
→ verification checks
→ save Localisation
→ complete AgentRun
```

This is intentionally strict: language/localisation must be based on `Contact.languages`, not name, nationality, company, or location.

### 6.7 Save meeting note

Files:

- `src/app/api/interactions/route.ts`
- `src/services/interaction.service.ts`

Sequence:

```txt
POST /api/interactions
→ validate { contactId, meetingContext?, userNotes }
→ getCurrentUser()
→ verify contact belongs to user
→ create Interaction with eventId copied from contact
→ return { interaction }
```

No AI is involved here.

### 6.8 Draft follow-up

Files:

- `src/app/api/followups/route.ts`
- `src/services/followup.service.ts`
- `src/ai/prompts/followup.ts`
- `src/ai/mocks/followup.ts`
- `src/ai/schemas/followup.schema.ts`

Sequence:

```mermaid
sequenceDiagram
  participant UI as ContactActionPanel
  participant API as POST /api/followups
  participant Service as followup.service
  participant AI as mock LLM client
  participant DB as Prisma/MySQL

  UI->>API: { contactId, interactionId?, meetingNote }
  API->>API: Zod validate request
  API->>Service: generateFollowUp(input, userId)
  Service->>DB: create AgentRun(status=running)
  Service->>DB: load contact + user profile scoped by userId
  Service->>DB: if interactionId exists, verify it belongs to user/contact
  Service->>AI: generate with FollowUpOutputSchema + mock output
  AI-->>Service: requiresUserReview=true draft
  Service->>Service: UserReviewInvariantSchema.parse(...)
  Service->>Service: verification.service check
  Service->>DB: create FollowUp(status="drafted", userApproved=false, sentAt=null)
  Service->>DB: complete AgentRun(status=success)
  Service-->>API: FollowUpOutput + followUpId
```

There is no send function. The data model has `sentAt`, but current code never sets it to a real timestamp and never sends externally.

---

## 7. Service layer reference

### `src/services/event.service.ts`

Current functions:

- `getEventById(eventId, userId)`

Purpose:

- Fetch one event scoped to the current user.
- Convert `tags` JSON to `string[]`.
- Include contact count.

Used by:

- `src/app/events/[eventId]/page.tsx`
- `GET /api/events/[eventId]`

### `src/services/contact.service.ts`

Current functions:

- `listContactsForEvent(eventId, userId)`
- `getContactById(contactId, userId)`

Purpose:

- List event contacts for dashboard.
- Build a contact detail read model that includes latest related AI outputs and recent interactions.
- Normalize JSON arrays like `tags`, `languages`, `talkingPoints`, `warnings` into typed string arrays.

Used by:

- Event dashboard page.
- Contact detail page.
- Contact API routes.

### `src/services/ranking-score.ts`

Current functions:

- `scoreContactForGoal(contact, goal, eventIndustry, now?)`
- `rankContactRecords(contacts, goal, eventIndustry, now?)`

Purpose:

- Classify opportunity type from contact data.
- Parse the user/event goal into opportunity categories.
- Score each contact across nine deterministic dimensions.
- Sort descending by score.
- Produce validated ranking drafts.

Important detail:

- This file is pure logic and does not call the database.
- It is covered by `src/services/ranking-score.test.ts`.

### `src/services/ranking.service.ts`

Current functions:

- `rankContacts(eventId, requestedGoal, userId)`
- `getRankingById(rankingId, userId)`

Purpose:

- Create an `AgentRun`.
- Load event + contacts.
- Run deterministic scoring.
- Validate with `RankingOutputSchema`.
- Save `Ranking` and `RankingItem` rows.
- Return saved ranking output.
- Read saved rankings for the results page.

### `src/services/briefing.service.ts`

Current functions:

- `getLatestBriefingForContact(contactId, userId)`
- `generateBriefing(contactId, userId)`

Purpose:

- Read latest saved briefing.
- Generate and persist a new briefing.
- Use prompt builder, mock LLM client, Zod schema, and verification service.

### `src/services/localisation.service.ts`

Current functions:

- `selectStatedLanguage(languages, requestedLanguage?)`
- `applyLocalisationVerification(output)`
- `generateLocalisation(contactId, requestedLanguage, userId)`

Purpose:

- Enforce explicit-language grounding.
- Generate a localised opener.
- Penalize/block unsafe generated output through verification.
- Save `Localisation`.

### `src/services/followup.service.ts`

Current functions:

- `generateFollowUp(input, userId)`

Purpose:

- Validate contact and optional interaction ownership.
- Generate a follow-up draft based on the meeting note.
- Enforce `requiresUserReview: z.literal(true)`.
- Save `FollowUp` as `status: "drafted"`, `userApproved: false`, `sentAt: null`.

### `src/services/interaction.service.ts`

Current functions:

- `createInteractionNote(input, userId)`

Purpose:

- Validate that the contact belongs to the user.
- Save meeting notes as an `Interaction`.

### `src/services/identity-resolution.service.ts`

Current functions:

- `resolveContact(input, userId)`

Purpose:

- Future contact-import helper.
- Checks exact email, phone, or stored LinkedIn URL matches.
- Checks same company + normalized name similarity.

Current limitation:

- No API route currently calls this function.
- It does not fetch LinkedIn. It only compares a user-provided stored URL string.

### `src/services/agent-run.service.ts`

Current functions:

- `startAgentRun(params)`
- `completeAgentRun(agentRunId, params)`

Purpose:

- Trace every AI/deterministic generation run.
- Store input, output, status, latency, token counts, and errors.

### `src/services/verification.service.ts`

Current functions:

- `checkOutput(output, type)`

Purpose:

- Collect string content from generated outputs.
- Flag cultural stereotypes and sensitive-trait inference.
- Warn on overconfident language.

Current limitation:

- The `type` parameter is currently unused except for future extension.

---

## 8. AI implementation

### Current LLM adapter

`src/ai/client.ts` defines:

- `LLMClient`
- `mockLLMClient`
- `getLLMClient()`

The mock client does this:

```txt
schema.parse(mockOutput)
→ count rough input/output tokens
→ return output
```

No external API call is made.

### Prompt safety pattern

Prompt builders:

- `src/ai/prompts/briefing.ts`
- `src/ai/prompts/followup.ts`
- `src/ai/prompts/localisation.ts`

They all:

1. Convert contextual data into JSON.
2. Escape `<` and `>` to reduce tag-boundary prompt injection.
3. Wrap it inside `<USER_PROVIDED_CONTEXT>`.
4. Instruct the model to treat that context as data, not instructions.

### Zod output schemas

| Schema | File | Enforces |
|---|---|---|
| `RankingOutputSchema` | `src/ai/schemas/ranking.schema.ts` | Ranking ID, event ID, goal, ranked contacts, score breakdown ranges, opportunity enum. |
| `BriefingOutputSchema` | `src/ai/schemas/briefing.schema.ts` | Summary, why they matter, decision authority enum, exactly 3 talking points, exactly 2 questions, cultural notes, warnings, confidence. |
| `LocalisationOutputSchema` | `src/ai/schemas/localisation.schema.ts` | Opener text, language used, confidence, warnings. |
| `FollowUpOutputSchema` | `src/ai/schemas/followup.schema.ts` | Subject, draft text, timing, reasoning, confidence, warnings, `requiresUserReview: z.literal(true)`. |

### Mock output factories

| Factory | File | Purpose |
|---|---|---|
| `createMockBriefing` | `src/ai/mocks/briefing.ts` | Creates plausible briefing based on contact/event/user profile data. |
| `createMockLocalisation` | `src/ai/mocks/localisation.ts` | Creates language-specific opener for explicitly selected language. |
| `createMockFollowUp` | `src/ai/mocks/followup.ts` | Creates a review-only follow-up draft from meeting note. |

---

## 9. Auth and authorization

### Current implementation

`src/lib/auth.ts` returns a fixed demo user:

```ts
{
  id: "clu00000000000000000001",
  email: "alex@lodestar.ai",
  name: "Alex Tan"
}
```

Every implemented API route calls `getCurrentUser()` and passes `user.id` to the service layer.

Services then scope database reads/writes with `userId`.

### What this means

For the demo:

- Auth works as a placeholder.
- User scoping is already designed into service signatures.
- Seed data lines up with the mock user ID.

For production:

- Replace `getCurrentUser()` with real session handling.
- Ensure real users map to `User.id`.
- Add middleware/route protection as needed.
- Add tests for cross-user access denial.

---

## 10. Safety and privacy boundaries

Current hard rules enforced by implementation and audit:

- No LinkedIn scraping.
- No LinkedIn API calls.
- Stored `linkedinUrl` fields are allowed only as user-provided evidence/deduplication data.
- No automatic email/message sending.
- Follow-ups are drafts only.
- `requiresUserReview` is locked to `z.literal(true)`.
- No autonomous agent loops.
- Cultural/localisation advice must be grounded in explicitly stated languages/preferences.
- AI outputs are Zod-validated before writes.
- AI generation runs create `AgentRun` records.

Relevant files:

- `_workspace/qa_checklist.md`
- `src/services/followup.service.ts`
- `src/services/localisation.service.ts`
- `src/services/verification.service.ts`
- `src/ai/prompts/*.ts`
- `src/ai/schemas/*.ts`

---

## 11. Frontend-backend integration map

| UI file | Backend used | What happens |
|---|---|---|
| `src/app/events/[eventId]/page.tsx` | `getEventById`, `listContactsForEvent` | Server renders event dashboard from DB. |
| `src/components/events/RankContactsButton.tsx` | `POST /api/rankings` | Creates ranking and redirects to ranking page. |
| `src/app/rankings/[rankingId]/page.tsx` | `getRankingById` | Server renders saved ranking. |
| `src/app/contacts/[contactId]/page.tsx` | `getContactById` | Server renders contact detail and initial action state. |
| `src/components/contacts/ContactActionPanel.tsx` | `/api/briefings`, `/api/localisations`, `/api/interactions`, `/api/followups` | Runs interactive contact workflow. |
| `src/components/followups/FollowUpDraftButton.tsx` | `POST /api/followups` | Creates draft-only follow-up. |

This explains why the app may look “frontend-rendered”: several reads happen directly in server components. Those server components are still backend code executing on the server; they call Prisma-backed services without going through HTTP.

---

## 12. Tests currently present

Test command:

```bash
npm test
```

This runs:

```bash
tsx --test src/services/*.test.ts
```

Current test files:

| File | Coverage |
|---|---|
| `src/services/ranking-score.test.ts` | Score range validation, investor ranking, seeded demo goal keeps Sarah Tan first. |
| `src/services/briefing.test.ts` | Mock briefing schema, prompt boundary escaping, stereotype verification. |
| `src/services/localisation.test.ts` | Explicit language selection, Japanese opener schema, stereotype confidence penalty. |
| `src/services/followup.test.ts` | Review invariant, two-paragraph draft shape, prompt boundary escaping. |

Not currently covered:

- API route integration tests.
- Prisma integration tests with a real MySQL test database.
- Cross-user access denial tests.
- UI tests.
- Real LLM provider tests.

---

## 13. Local developer workflow

Install dependencies:

```bash
npm install
```

Set database URL:

```bash
export DATABASE_URL="mysql://user:pass@localhost:3306/lodestar"
```

Validate Prisma schema:

```bash
npx prisma validate
```

Push schema to local database:

```bash
npx prisma db push
```

Seed demo data:

```bash
npx prisma db seed
```

Run app:

```bash
npm run dev
```

Run checks:

```bash
npm test
npm run typecheck
npm run lint
DATABASE_URL="mysql://user:pass@localhost:3306/lodestar" npx prisma validate
DATABASE_URL="mysql://user:pass@localhost:3306/lodestar" npm run build
```

---

## 14. Backend architecture plan from here

This section describes how the backend should evolve from the current MVP into a stable production architecture.

### Phase A — Stabilise current backend contracts

Goal: make the existing backend understandable and safe to extend.

Tasks:

1. Keep this document updated whenever API routes/services change.
2. Replace stale `_workspace/technical_plan.md` status tables or point them here.
3. Add a central API contract document or OpenAPI spec.
4. Standardise response shapes:
   - Success: `{ data: ... }` or current direct object, choose one.
   - Error: `{ error: string, details?: unknown }`.
5. Add integration tests for all API routes.
6. Add service-level tests for `contact.service.ts`, `briefing.service.ts`, `followup.service.ts`, and `localisation.service.ts`.

### Phase B — Real auth and authorization

Goal: replace mock identity without rewriting every service.

Tasks:

1. Replace `getCurrentUser()` with Clerk or Auth.js integration.
2. Ensure external auth identity maps to `User.authProvider` / `User.authProviderId`.
3. Add route protection middleware.
4. Add cross-user access tests:
   - User A cannot fetch User B's event.
   - User A cannot rank User B's contacts.
   - User A cannot generate follow-up for User B's contact.
5. Add user creation/profile bootstrap flow.

Why this is straightforward:

- Services already accept `userId`.
- Queries already include `userId` in critical paths.

### Phase C — Database migrations and environments

Goal: make database changes deployable.

Tasks:

1. Commit Prisma migrations under `prisma/migrations/`.
2. Define local/dev/staging/prod database workflow.
3. Make seed scripts environment-aware:
   - Demo seed for local/staging.
   - No accidental seed into production unless explicitly enabled.
4. Review indexes for expected access patterns:
   - Events by `userId`.
   - Contacts by `userId`, `eventId`, email, phone, stored `linkedinUrl`.
   - Rankings by `userId`, `eventId`.
   - RankingItems by `rankingId`, `rankPosition`.
5. Add backup/rollback procedure for production migrations.

### Phase D — Real LLM provider adapter

Goal: swap mock AI for a real provider without changing service contracts.

Current seam:

- `src/ai/client.ts`
- `getLLMClient()`
- `LLMClient.generate<T>()`

Tasks:

1. Add provider selection via env:
   - `AI_PROVIDER=mock|openai|...`
   - `OPENAI_API_KEY=...`
2. Keep the same `GenerateParams<T>` contract.
3. Ensure provider output is always parsed with the passed Zod schema.
4. Add timeout and retry policy.
5. Store actual model name, token counts, latency, and cost estimate in `AgentRun`.
6. Add redaction rules for logs.
7. Add tests using mock provider fixtures, not live API calls.

Important:

- Do not let a real LLM call tools directly.
- Do not let a real LLM write to Prisma directly.
- Keep the service orchestration deterministic.

### Phase E — Contact import pipeline

Goal: move from seeded contacts to real input capture.

Schema already has:

- `ContactImport`
- `identity-resolution.service.ts`

Tasks:

1. Add import endpoints:
   - `POST /api/contact-imports`
   - `GET /api/contact-imports/[id]`
2. Add parsers for:
   - Manual form input.
   - VCF.
   - QR payloads.
   - OCR/business card later.
3. Use `resolveContact()` before creating contacts.
4. Store raw payload in `ContactImport.sourcePayload` / `rawExtractedText`.
5. Never scrape LinkedIn; only store user-provided URLs.

### Phase F — Observability and audit logs

Goal: make backend actions debuggable.

Tasks:

1. Use `AuditLog` for user-visible mutations:
   - Contact created/updated.
   - Interaction created.
   - Ranking generated.
   - Briefing generated.
   - Follow-up draft generated.
2. Add structured logging around route handlers and service errors.
3. Add request IDs.
4. Track AI latency/cost through `AgentRun`.
5. Consider a dashboard/admin view later.

### Phase G — Background work without autonomous agents

Goal: support slower jobs safely.

Allowed future pattern:

```txt
Explicit user action
→ creates a job
→ worker performs bounded known task
→ saves draft/result
→ user reviews
```

Forbidden:

```txt
Autonomous loop
→ decides who to contact
→ sends message externally
```

If background jobs are added later:

- Use a queue like BullMQ/Cloud Tasks/provider queue only for bounded jobs.
- Jobs must have explicit `userId`, entity IDs, and task type.
- Jobs must not send external messages without user action.

---

## 15. Known current gaps

| Gap | Impact | Recommended fix |
|---|---|---|
| Mock auth only | All users are Alex Tan in local/demo. | Replace `getCurrentUser()` with real auth provider. |
| No migrations committed | Harder to reproduce DB state safely across environments. | Generate and commit Prisma migrations. |
| Mock LLM only | AI behaviour is deterministic demo content. | Add provider adapter behind `LLMClient`. |
| No API integration tests | Route contract regressions may slip through. | Add tests for each API route using mocked services or test DB. |
| No contact import route | Contacts only come from seed data right now. | Build `ContactImport` workflow. |
| `AuditLog` unused | Mutations beyond `AgentRun` are less traceable. | Add audit writes in mutation services. |
| `ToolCall` unused | No per-tool tracing. | Add only if/when bounded tools are introduced. |
| Error response shape not fully standardised | Frontend must handle several response styles. | Define one API error envelope. |
| `_workspace/technical_plan.md` stale | New contributors may read wrong status. | Update or replace it with this doc. |

---

## 16. Mental model for new engineers

If you are trying to understand “where the backend is,” use this rule:

```txt
If a file is under src/app/api, it is HTTP backend.
If a page imports src/services directly, that page is doing server-side backend work.
If a file is under src/services, it is business/backend logic.
If a file is under src/ai, it is backend AI infrastructure.
If a file is under src/components, it is UI.
```

The project is not “frontend only.” It is a full-stack Next.js app where the backend is co-located with the frontend.

---

## 17. Immediate recommended next engineering tasks

1. Update `_workspace/technical_plan.md` to stop claiming core phases are “to start.”
2. Add API route integration tests.
3. Add real auth behind `getCurrentUser()`.
4. Commit Prisma migrations.
5. Standardise API response envelopes.
6. Add contact import endpoint using `identity-resolution.service.ts`.
7. Add `AuditLog` writes for mutations.
8. Add real LLM provider adapter while preserving mock mode.
