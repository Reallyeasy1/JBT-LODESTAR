---
name: lodestar-fullstack-build
description: Builds Next.js App Router pages, React components, Tailwind UI, and API route handlers for Lodestar. Use when implementing or updating any frontend page, UI component, or API route. Covers event dashboard, contact detail, ranking UI, briefing display, localisation UI, and follow-up draft UI. Invoke for any area:frontend or agent:fullstack-builder GitHub issue.
---

# Lodestar Fullstack Build Skill

## Purpose
Implement the user-facing Lodestar product in Next.js App Router with TypeScript and Tailwind CSS. Every page must be mobile-first and demo-ready.

## When to Use
- Implementing a new page or component from a GitHub issue
- Updating an existing page after schema or service contract change
- Building an API route handler
- Fixing a broken step in the demo flow

---

## Step 1: Claim the Issue
Follow `lodestar-github-workflow` skill - claim, branch, comment plan.

---

## Step 2: Read Contracts
Before writing any code:
1. Read `_workspace/technical_plan.md` - service function signatures available
2. Read `prisma/schema.prisma` - understand available data shapes
3. Read issue acceptance criteria - these are your definition of done

Do not start implementation if service contracts are missing. Add `blocked-by-api` label and notify orchestrator.

---

## Step 3: Implement

### Page Pattern
```tsx
// src/app/events/[eventId]/page.tsx
import { getEvent } from "@/services/..."  // server action or fetch
export default async function EventPage({ params }) {
  const event = await getEvent(params.eventId)
  return <EventDashboard event={event} />
}
```

### API Route Pattern
```ts
// src/app/api/events/[eventId]/route.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
export async function GET(req, { params }) {
  const user = await getCurrentUser()
  // call service function, not Prisma directly
  return NextResponse.json(data)
}
```

### Rules
- Call service functions from API routes - never call Prisma from routes or pages directly
- Use `getCurrentUser()` from `src/lib/auth.ts` in every authenticated route
- Use Tailwind for all styles - no custom CSS files
- Mobile-first: build for 375px, enhance for wider
- Loading and error states: every data-fetching component needs both

---

## Step 4: Required Pages Checklist
| Page | Path | Key elements |
|------|------|-------------|
| Landing | `/` | Tagline, demo CTA, workflow example |
| Onboarding | `/onboarding` | Profile form: name, role, company, bio, LinkedIn, languages, goal, tone |
| Dashboard | `/dashboard` | Event list, create event button |
| Event | `/events/[eventId]` | Goal, contact list, "Rank Contacts" button, top-5 preview, follow-ups |
| Contact | `/contacts/[contactId]` | Info, briefing, talking points, cultural section, notes, follow-up button |
| Ranking | `/rankings/[rankingId]` | Goal text, ranked list with score/type/reasoning/next action/confidence |

---

## Step 5: PR Submission
- Title: `feat(frontend): [description] - closes #N`
- Body: summary, list of files changed, screenshots (required for UI changes), test plan
- Move issue to `status:review`
- Tag `safety-qa-engineer` for review

---

## Files to Inspect
- `_workspace/technical_plan.md` (service contracts)
- `prisma/schema.prisma` (data shapes)
- `src/lib/auth.ts` (getCurrentUser)
- `src/lib/db.ts` (Prisma client)

## Files to Modify (per issue scope)
- `src/app/**` - pages, layouts, route handlers
- `src/components/**` - reusable UI components

## Anti-Overengineering Rules
- Do not create a custom hook when a server component works
- Do not add a new npm package if an existing one covers the need
- Do not build a component "for reuse later" - build what the current issue requires
- Do not add animations, skeleton loaders, or polish until core flow works

## Acceptance Criteria
- Page loads at the correct URL without errors
- Mobile layout correct at 375px viewport
- All displayed data comes from API/MySQL - nothing hardcoded in components
- `getCurrentUser()` is used for all auth-gated routes
- PR includes screenshots of UI on mobile and desktop

## Common Failure Modes
- Building frontend before schema is seeded -> wait for `data-backend-engineer`
- Calling Prisma directly in a page -> refactor to API route or server action via service
- Forgetting loading/error states -> users see blank screen on slow connections
- Hardcoding the demo user's ID -> will break when auth is added
