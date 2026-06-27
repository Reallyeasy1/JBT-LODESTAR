# CLAUDE.md

# Lodestar — Claude Code Project Instructions

## Project Summary

Lodestar is an AI-powered networking operating system for conferences and professional events.

The product helps users capture contacts from multiple sources, understand who each person is, rank which contacts matter most for the user's networking goal, generate conversation briefings, localise contact-card introductions, and draft follow-ups after meetings.

Core promise:

> Lodestar turns every event contact into a ranked next action.

The initial product is not a generic contact manager. It is an event-specific relationship intelligence system.

---

## Initial Product Scope

Build an MVP that supports this workflow:

1. User creates profile.
2. User creates/selects event.
3. User enters networking goal.
4. User imports or manually creates contacts.
5. System detects duplicates.
6. System generates briefings.
7. System ranks top contacts for the user's goal.
8. System generates localised intro/contact-card text.
9. User adds meeting notes.
10. System drafts follow-up message.

For the first implementation, prioritise:

* Fast demo flow.
* Clean data model.
* Clear UX.
* Bounded AI calls.
* User-editable outputs.
* MySQL source-of-truth database.
* No overengineering.

---

## Tech Stack

Use this stack unless explicitly changed:

* Frontend: Next.js App Router
* Language: TypeScript
* Styling: Tailwind CSS
* Database: MySQL
* ORM: Prisma
* Auth: initially mock/session placeholder; prepare for Clerk/Auth.js later
* File upload: local placeholder first; prepare abstraction for S3/R2 later
* LLM: provider abstraction, initially mockable
* Queue: do not implement real queue yet; use async service functions first
* Deployment target: Vercel-compatible

Do not use PostgreSQL.

Do not add a graph database.

Do not add a vector database in the initial scaffold.

Do not add Kubernetes.

Do not implement autonomous background agents yet.

---

## Architecture Principles

Use deterministic workflows with bounded AI functions.

Correct pattern:

```txt
User action
→ API route/server action
→ Database write
→ Service function
→ AI generation function if needed
→ Verification function
→ Save draft
→ User review
```

Avoid this pattern:

```txt
User action
→ Free-running agent
→ Agent decides tools/actions freely
→ Agent mutates database directly
```

AI outputs must be structured, editable, and traceable.

Every AI-generated briefing, ranking, or follow-up should eventually be associated with an `agent_run` record.

---

## Core Entities

Implement the data model around these entities:

* User
* UserProfile
* Event
* Contact
* ContactImport
* Interaction
* Briefing
* Ranking
* RankingItem
* FollowUp
* AgentRun
* ToolCall
* AuditLog
* Feedback

Use MySQL-compatible Prisma schema.

Use `String @id @default(uuid())` for IDs initially.

Use `Json` for flexible AI outputs such as evidence, warnings, metadata, tags, languages, and raw parsed payloads.

Keep core queryable fields as real columns, not only JSON.

---

## Suggested Prisma Models

Start with these models:

```prisma
model User {
  id             String        @id @default(uuid())
  email          String        @unique
  name           String?
  authProvider   String?
  authProviderId String?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  profile        UserProfile?
  events         Event[]
  contacts       Contact[]
  agentRuns      AgentRun[]
  auditLogs      AuditLog[]
}

model UserProfile {
  id                         String   @id @default(uuid())
  userId                     String   @unique
  displayName                String?
  title                      String?
  company                    String?
  bio                        String?  @db.Text
  linkedinUrl                String?
  websiteUrl                 String?
  languages                  Json?
  networkingGoals            Json?
  whatIOffer                 Json?
  preferredTone              String?
  defaultContactCardLanguage String?
  privacySettings            Json?
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Event {
  id          String   @id @default(uuid())
  userId      String
  name        String
  location    String?
  startDate   DateTime?
  endDate     DateTime?
  industry    String?
  description String?  @db.Text
  eventGoal   String?  @db.Text
  tags        Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  contacts  Contact[]
  rankings  Ranking[]

  @@index([userId])
}

model Contact {
  id               String   @id @default(uuid())
  userId           String
  eventId          String?
  fullName         String?
  title            String?
  company          String?
  email            String?
  phone            String?
  linkedinUrl      String?
  websiteUrl       String?
  languages        Json?
  sourceType       String?
  sourceConfidence Float?
  tags             Json?
  notes            String?  @db.Text
  metadata         Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  event        Event?        @relation(fields: [eventId], references: [id], onDelete: SetNull)
  interactions Interaction[]
  briefings    Briefing[]
  rankingItems RankingItem[]
  followUps    FollowUp[]

  @@index([userId])
  @@index([eventId])
  @@index([email])
  @@index([phone])
  @@index([linkedinUrl])
}

model ContactImport {
  id               String   @id @default(uuid())
  userId           String
  eventId          String?
  sourceType       String
  fileId           String?
  sourcePayload    Json?
  rawExtractedText String?  @db.Text
  parsedJson       Json?
  status           String   @default("pending")
  errorMessage     String?  @db.Text
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([userId])
  @@index([eventId])
  @@index([status])
}

model Interaction {
  id              String   @id @default(uuid())
  userId          String
  contactId       String
  eventId         String?
  interactionTime DateTime @default(now())
  meetingContext  String?  @db.Text
  userNotes       String?  @db.Text
  aiSummary       String?  @db.Text
  nextAction      String?  @db.Text
  outcome         String?
  createdAt       DateTime @default(now())

  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([contactId])
  @@index([eventId])
}

model Briefing {
  id                String   @id @default(uuid())
  userId            String
  contactId         String
  agentRunId        String?
  personSummary     String?  @db.Text
  whyTheyMatter     String?  @db.Text
  likelyGoal        String?  @db.Text
  decisionAuthority String?
  talkingPoints     Json?
  questionsToAsk    Json?
  culturalNotes     Json?
  warnings          Json?
  confidenceScore   Float?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([contactId])
}

model Ranking {
  id            String   @id @default(uuid())
  userId        String
  eventId       String?
  goalText      String   @db.Text
  modelName     String?
  promptVersion String?
  createdAt     DateTime @default(now())

  event Event? @relation(fields: [eventId], references: [id], onDelete: SetNull)
  items RankingItem[]

  @@index([userId])
  @@index([eventId])
}

model RankingItem {
  id              String   @id @default(uuid())
  rankingId       String
  contactId       String
  rankPosition    Int
  score           Float?
  opportunityType String?
  reasoning       String?  @db.Text
  nextAction      String?  @db.Text
  evidence        Json?
  confidence      Float?
  createdAt       DateTime @default(now())

  ranking Ranking @relation(fields: [rankingId], references: [id], onDelete: Cascade)
  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@index([rankingId])
  @@index([contactId])
  @@index([rankPosition])
}

model FollowUp {
  id                String   @id @default(uuid())
  userId            String
  contactId         String
  interactionId     String?
  subject           String?
  draftText         String?  @db.Text
  status            String   @default("drafted")
  recommendedTiming String?
  userApproved      Boolean  @default(false)
  sentAt            DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  contact Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([contactId])
  @@index([status])
}

model AgentRun {
  id            String   @id @default(uuid())
  userId        String
  taskType      String?
  agentType     String?
  modelName     String?
  promptVersion String?
  inputJson     Json?
  outputJson    Json?
  status        String?
  latencyMs     Int?
  tokenInput    Int?
  tokenOutput   Int?
  costEstimate  Float?
  errorMessage  String?  @db.Text
  createdAt     DateTime @default(now())

  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  toolCalls ToolCall[]

  @@index([userId])
  @@index([agentType])
  @@index([taskType])
  @@index([status])
  @@index([createdAt])
}

model ToolCall {
  id          String   @id @default(uuid())
  agentRunId  String
  toolName    String?
  inputJson   Json?
  outputJson  Json?
  status      String?
  latencyMs   Int?
  errorMessage String? @db.Text
  createdAt   DateTime @default(now())

  agentRun AgentRun @relation(fields: [agentRunId], references: [id], onDelete: Cascade)

  @@index([agentRunId])
  @@index([toolName])
  @@index([status])
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  entityType String?
  entityId   String?
  action     String?
  oldValue   Json?
  newValue   Json?
  ipAddress  String?
  userAgent  String? @db.Text
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
}

model Feedback {
  id           String   @id @default(uuid())
  userId       String
  entityType   String?
  entityId     String?
  rating       Int?
  feedbackText String?  @db.Text
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([rating])
}
```

---

## App Structure

Use this project structure:

```txt
src/
├── app/
│   ├── page.tsx
│   ├── onboarding/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── events/
│   │   ├── page.tsx
│   │   └── [eventId]/
│   │       └── page.tsx
│   ├── contacts/
│   │   └── [contactId]/
│   │       └── page.tsx
│   ├── rankings/
│   │   └── [rankingId]/
│   │       └── page.tsx
│   └── api/
│       ├── profile/
│       │   └── route.ts
│       ├── events/
│       │   └── route.ts
│       ├── contacts/
│       │   └── route.ts
│       ├── contact-imports/
│       │   └── route.ts
│       ├── briefings/
│       │   └── route.ts
│       ├── rankings/
│       │   └── route.ts
│       ├── interactions/
│       │   └── route.ts
│       └── followups/
│           └── route.ts
├── components/
│   ├── ui/
│   ├── contacts/
│   ├── events/
│   ├── briefings/
│   ├── rankings/
│   └── followups/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── validators.ts
│   ├── idempotency.ts
│   └── audit.ts
├── services/
│   ├── contact-capture.service.ts
│   ├── identity-resolution.service.ts
│   ├── context-enrichment.service.ts
│   ├── ranking.service.ts
│   ├── briefing.service.ts
│   ├── cultural-briefing.service.ts
│   ├── followup.service.ts
│   ├── verification.service.ts
│   └── agent-run.service.ts
├── ai/
│   ├── client.ts
│   ├── prompts/
│   │   ├── briefing.ts
│   │   ├── ranking.ts
│   │   ├── cultural.ts
│   │   ├── followup.ts
│   │   └── verifier.ts
│   └── schemas/
│       ├── contact.schema.ts
│       ├── briefing.schema.ts
│       ├── ranking.schema.ts
│       ├── cultural.schema.ts
│       └── followup.schema.ts
├── tools/
│   ├── vcf-parser.ts
│   ├── vcf-generator.ts
│   ├── qr-parser.ts
│   ├── ocr.ts
│   └── contact-search.ts
└── okf/
    ├── index.md
    ├── log.md
    ├── workflows/
    │   ├── contact-capture.md
    │   ├── briefing-generation.md
    │   ├── top-5-ranking.md
    │   └── follow-up-generation.md
    ├── concepts/
    │   ├── opportunity-scoring.md
    │   ├── cultural-awareness.md
    │   ├── confidence-scoring.md
    │   └── evidence-grounding.md
    └── safety/
        ├── privacy-and-consent.md
        ├── prompt-injection.md
        └── anti-stereotyping.md
```

---

## Required Initial Pages

### 1. Landing Page

Path:

```txt
/
```

Purpose:

Explain Lodestar in one screen.

Must include:

* Product tagline.
* Demo CTA.
* Short explanation.
* Example workflow.

Use tagline:

```txt
Scan the room. Know who matters. Follow up before the opportunity goes cold.
```

---

### 2. Onboarding Page

Path:

```txt
/onboarding
```

Purpose:

Create user profile and networking goal.

Fields:

* Name
* Role
* Company
* Bio
* Website
* LinkedIn
* Languages
* Networking goal
* What I offer
* Preferred tone

---

### 3. Event Dashboard

Path:

```txt
/events/[eventId]
```

Purpose:

Show event-specific workflow.

Must include:

* Event goal
* Add/import contact button
* Contact list
* Generate ranking button
* Top 5 ranking preview
* Recent follow-ups

---

### 4. Contact Detail Page

Path:

```txt
/contacts/[contactId]
```

Purpose:

Show contact profile and AI briefing.

Must include:

* Contact info
* Source/confidence
* Briefing
* Talking points
* Cultural/localisation section
* Interaction notes
* Follow-up draft button

---

### 5. Ranking Page

Path:

```txt
/rankings/[rankingId]
```

Purpose:

Show ranked contacts.

Must include:

* Goal text
* Ranked list
* Score
* Opportunity type
* Reasoning
* Next action
* Confidence

---

## Required API Routes

Implement these API routes first:

```txt
POST /api/profile
GET  /api/profile

POST /api/events
GET  /api/events
GET  /api/events/:eventId

POST /api/contacts
GET  /api/contacts
GET  /api/contacts/:contactId

POST /api/contact-imports

POST /api/briefings
GET  /api/briefings/:briefingId

POST /api/rankings
GET  /api/rankings/:rankingId

POST /api/interactions

POST /api/followups
GET  /api/followups/:followupId

POST /api/feedback
```

For MVP, use simple authenticated mock user if auth is not implemented yet.

Create a clear `getCurrentUser()` helper that can later be replaced with real auth.

---

## Agent Service Requirements

Implement services as normal TypeScript functions.

Do not implement autonomous agent loops.

### `contact-capture.service.ts`

Responsibilities:

* Parse manual input.
* Parse `.vcf` payload later.
* Accept OCR result later.
* Return structured contact draft.

### `identity-resolution.service.ts`

Responsibilities:

* Search contacts by email, phone, LinkedIn URL.
* Check same name + company.
* Return duplicate/possible duplicate/new contact.

### `ranking.service.ts`

Responsibilities:

* Retrieve contacts for event.
* Compute deterministic score.
* Optionally call LLM for explanation.
* Save ranking and ranking items.

Initial deterministic scoring should work even without LLM.

### `briefing.service.ts`

Responsibilities:

* Load user profile, event, contact.
* Generate contact briefing.
* Save briefing.
* Call verification service before saving final output.

### `cultural-briefing.service.ts`

Responsibilities:

* Generate language/localisation advice.
* Avoid stereotypes.
* Use explicit language preference first.
* Mark uncertainty clearly.

### `followup.service.ts`

Responsibilities:

* Generate follow-up draft from meeting notes.
* Never send externally.
* Save as draft.

### `verification.service.ts`

Responsibilities:

* Check generated output for:

  * Unsupported claims
  * Unsafe cultural assumptions
  * Privacy risks
  * Overconfident claims
  * Mention of unconfirmed sensitive traits

For MVP, implement deterministic checks and simple warning flags. LLM verification can be added later.

---

## Scoring Model

Implement this scoring model first:

```ts
type ContactScoreBreakdown = {
  goalMatch: number;          // 0-25
  roleRelevance: number;      // 0-15
  decisionInfluence: number;  // 0-15
  companyIndustryFit: number; // 0-10
  sharedContext: number;      // 0-10
  followupClarity: number;    // 0-10
  reciprocity: number;        // 0-5
  freshness: number;          // 0-5
  evidenceConfidence: number; // 0-5
};

totalScore =
  goalMatch +
  roleRelevance +
  decisionInfluence +
  companyIndustryFit +
  sharedContext +
  followupClarity +
  reciprocity +
  freshness +
  evidenceConfidence;
```

Rules:

* Do not rank contacts by prestige alone.
* A high-title contact with no goal relevance should not be ranked highly.
* Contacts with user notes indicating clear next action should get a boost.
* Contacts with weak evidence should have lower confidence.

---

## AI Output Schemas

Use Zod schemas for AI outputs.

### Briefing Output

```ts
export const BriefingOutputSchema = z.object({
  personSummary: z.string(),
  whyTheyMatter: z.string(),
  likelyGoal: z.string().optional(),
  decisionAuthority: z.enum(["low", "medium", "high", "unknown"]),
  talkingPoints: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
  culturalNotes: z.array(z.string()),
  warnings: z.array(z.string()),
  confidenceScore: z.number().min(0).max(100),
});
```

### Ranking Output

```ts
export const RankingOutputSchema = z.object({
  goal: z.string(),
  rankedContacts: z.array(
    z.object({
      contactId: z.string(),
      rank: z.number(),
      score: z.number().min(0).max(100),
      opportunityType: z.enum([
        "investor",
        "customer",
        "collaborator",
        "mentor",
        "hire",
        "recruiter",
        "friend",
        "other",
      ]),
      reasoning: z.string(),
      nextAction: z.string(),
      confidence: z.number().min(0).max(1),
      evidence: z.array(z.string()),
    })
  ),
});
```

### Follow-Up Output

```ts
export const FollowUpOutputSchema = z.object({
  subject: z.string(),
  draftText: z.string(),
  recommendedTiming: z.string(),
  reasoning: z.string(),
  confidence: z.number().min(0).max(1),
  requiresUserReview: z.literal(true),
});
```

---

## Cultural Guardrails

The product may provide cultural or language-aware suggestions.

Allowed:

* Greeting in a contact’s explicitly stated preferred language.
* Localised intro or contact card.
* Translation of technical terms.
* Professional tone advice.
* Cautious uncertainty-aware suggestions.

Disallowed:

* Stereotypes.
* Personality claims from nationality.
* Religion/ethnicity/politics assumptions.
* “Because they are from X, they prefer Y.”
* Saving inferred cultural identity as fact.

Use wording like:

```txt
Their profile lists Japanese as a preferred language. You can open with a short Japanese greeting, then continue in English unless they respond in Japanese.
```

Avoid wording like:

```txt
Because they are Japanese, they prefer indirect communication.
```

---

## OKF Knowledge Bundle

Create an `src/okf` or root `okf` directory.

OKF stores durable agent knowledge:

* Workflows
* Agent rules
* Ranking rubrics
* Cultural guardrails
* Safety rules
* Eval rubrics

OKF must not store:

* Raw user contacts
* Private user profile data
* Uploaded business card images
* Agent run logs
* Tool call logs
* Audit logs
* Sensitive inferred traits

Initial OKF files to create:

```txt
okf/index.md
okf/log.md
okf/workflows/contact-capture.md
okf/workflows/briefing-generation.md
okf/workflows/top-5-ranking.md
okf/concepts/cultural-awareness.md
okf/concepts/opportunity-scoring.md
okf/safety/privacy-and-consent.md
okf/safety/anti-stereotyping.md
```

---

## Seed Demo Data

Create seed data for demo.

Use one demo user:

```txt
Name: Alex Tan
Role: Founder
Company: Lodestar
Goal: Find investors, pilot customers, and AI/backend collaborators.
```

Create one demo event:

```txt
Name: Sup Build2026 Hackathon
Location: Singapore
Industry: AI/startups
Goal: Find investors, pilot customers, and AI/backend collaborators.
```

Create 6 contacts:

1. Sarah Tan — Partner, Seed Ventures — investor
2. Daniel Wong — Enterprise Innovation Lead, DBS — pilot customer
3. Mei Nakamura — AI Platform Engineer, Rakuten — technical collaborator
4. Priya Menon — Technical Recruiter, ByteDance — recruiter
5. Sarah T. — Partner, Seed Ventures — duplicate of Sarah
6. Aaron Lee — Founder, EventOps — event organiser / potential customer

Seed enough fields so ranking demo works.

---

## Demo Flow to Optimise For

The app should support this demo:

1. User opens event dashboard.
2. User sees networking goal.
3. User imports or views seeded contacts.
4. User clicks “Rank Top Contacts.”
5. App shows top 5 ranked contacts.
6. User opens top contact.
7. App shows briefing and opener.
8. User generates localised intro.
9. User adds meeting note.
10. App drafts follow-up.

Demo line:

```txt
Before Lodestar, you leave events with a list of names. After Lodestar, you leave with ranked opportunities and next actions.
```

---

## Implementation Order

Build in this order:

1. Initialise Next.js + TypeScript + Tailwind.
2. Add Prisma + MySQL.
3. Create schema and migration.
4. Add seed data.
5. Build landing page.
6. Build onboarding/profile page.
7. Build event dashboard.
8. Build contact list and contact detail page.
9. Build deterministic ranking service.
10. Build ranking API and UI.
11. Build briefing generation service with mock AI first.
12. Add real LLM provider abstraction.
13. Add follow-up draft generation.
14. Add OKF files.
15. Add basic verification warnings.
16. Polish demo flow.

Do not start with AI complexity.

Start with data model and demoable product flow.

---

## Definition of Done for Initial Scaffold

The initial scaffold is complete when:

* App runs locally.
* MySQL connects through Prisma.
* Seed script creates demo user, event, and contacts.
* Event dashboard displays contacts.
* Ranking button generates a ranked list.
* Contact detail page displays briefing placeholder or generated briefing.
* Follow-up draft can be generated from a note.
* OKF directory exists with starter files.
* No autonomous external sending exists.
* No LinkedIn scraping exists.

---

## Critical Product Rules

* The user owns their contact data.
* The system must be useful even without perfect enrichment.
* Ranking must be goal-specific.
* Briefings must be short enough to use during an event.
* Cultural advice must be cautious and non-stereotypical.
* Follow-ups must be drafts, not automatic sends.
* AI-generated content must be editable.
* MySQL is the source of truth.
* OKF is agent knowledge, not user storage.
* Avoid overengineering until the core workflow works.

---

## First Task for Claude Code

Initialise the Lodestar codebase.

Create:

* Next.js App Router project
* TypeScript
* Tailwind
* Prisma
* MySQL datasource
* Initial Prisma schema
* Seed script with demo data
* Basic route/page structure
* Event dashboard
* Contact detail page
* Ranking service with deterministic scoring
* OKF starter directory

Prioritise a working vertical slice over completeness.

The first vertical slice should be:

```txt
Demo user
→ Demo event
→ Demo contacts
→ Rank top contacts
→ Open contact briefing
→ Draft follow-up
```
