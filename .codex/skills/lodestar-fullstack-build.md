---
name: lodestar-fullstack-build
description: Playbook for Next.js pages, React components, Tailwind UI, and API route handlers.
---

# Lodestar Fullstack Build Playbook

Use for Next.js pages, React components, Tailwind UI, and API route handlers.

## Steps

1. Follow `.codex/skills/lodestar-github-workflow.md` if working from an issue.
2. Read `_workspace/technical_plan.md` and acceptance criteria.
3. Confirm service contracts exist before frontend work.
4. Implement mobile-first UI and structured API routes.
5. Verify pages load, API routes return structured errors, and data comes from services.

## API Route Pattern

```ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  // call service function
  return NextResponse.json({ data });
}
```

## Rules

- API routes call service functions.
- Components do not call Prisma directly.
- API routes do not call LLMs directly.
- Use Tailwind CSS.
- Include loading/error states where relevant.
