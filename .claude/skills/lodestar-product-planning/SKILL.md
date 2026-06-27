---
name: lodestar-product-planning
description: Defines and maintains Lodestar product scope, demo story, and MVP feature boundaries. Use when product scope is ambiguous, a new feature is proposed for Lodestar, the demo flow has a gap, issue acceptance criteria are vague, or sprint prioritisation is needed. Invoke when asked about what to build, what to cut, or how the demo should work.
---

# Lodestar Product Planning Skill

## Purpose
Maintain a crisp, demoable MVP scope. Cut everything that doesn't serve the core wedge.

Core wedge: **"I met many people at an event. Which 5 matter for my goal, why, and what do I do next?"**

## When to Use
- Evaluating a new feature proposal
- Refining a GitHub issue with vague acceptance criteria
- Planning a sprint (which issues are p0 vs defer)
- Writing or updating the 30-second demo script
- Deciding if something is in or out of MVP scope

---

## Step 1: Read Current State
1. Read `_workspace/product_scope.md`
2. Read open GitHub issues (any `agent:product-architect` or `area:docs` issues)
3. Read `PROJECT_REQUIREMENTS.md` — core promise, implementation order, definition of done

---

## Step 2: Scope Evaluation Framework

For any proposed feature, ask in order:

1. **Does it directly support the core demo vertical slice?**
   - Demo: event dashboard → rank contacts → open briefing → add note → draft follow-up
   - If yes → include in MVP
   - If no → defer or cut

2. **Does it require a forbidden technology?**
   - PostgreSQL, pgvector, graph DB, vector DB, LinkedIn scraping, native mobile, NFC, CRM sync, autonomous agents, automatic sending
   - If yes → cut unconditionally

3. **Can it wait until the core flow works?**
   - If yes → label `priority:p2`, park in backlog
   - If no → it's p0 or p1

---

## Step 3: Issue Refinement

For each issue being refined, fill all fields:

```
Title: [Verb] [specific thing] (e.g. "Build seeded event dashboard page")
Goal: One sentence — what user outcome does this enable?
Context: Why does this exist? What's the dependency?
Scope: Exactly what to build. List files if known.
Files likely touched: src/app/..., src/components/..., etc.
Acceptance criteria: Binary pass/fail checks (5-8 items)
Test plan: How to verify manually
Dependencies: Issue numbers or "none"
Labels: area:X, agent:X, priority:pX, size:X, [parallel-safe or blocked-by-X]
Suggested agent: agent-name
```

**Acceptance criteria must be binary.** Bad: "The UI looks good." Good: "Event dashboard loads at `/events/[eventId]` with the seeded event name, goal text, and contact count displayed."

---

## Step 4: Demo Script Maintenance

The 30-second demo must always work end-to-end. Update `_workspace/product_scope.md` after any scope change:

```
Demo user opens /events/[eventId]
→ Sees "Sup Build2026 Hackathon", goal text, and 6 contacts listed
→ Clicks "Rank Top Contacts"
→ Sees top 5 ranked with score, opportunity type, reasoning, next action
→ Clicks top contact (Sarah Tan)
→ Sees briefing: summary, why they matter, talking points, questions to ask
→ Scrolls to cultural/localisation section
→ Clicks "Generate Intro" → sees localised contact card text
→ Types a meeting note → clicks "Draft Follow-Up"
→ Sees follow-up draft with subject and body, status "Draft — Review Before Sending"
```

---

## Files to Inspect
- `PROJECT_REQUIREMENTS.md` — source of truth for approved scope
- `_workspace/product_scope.md` — maintained output
- `_workspace/issue_backlog.md` — issue draft pool

## Files to Modify
- `_workspace/product_scope.md`
- `_workspace/issue_backlog.md`
- `.github/ISSUE_TEMPLATE/` (if templates need updating)

---

## Anti-Overengineering Rules
- Do not add a feature because "users might want it later" — only build what the demo needs
- Do not refine an issue to require more than one PR
- Do not add fields to issues that no agent will act on
- Do not plan beyond the current vertical slice until it ships

## Acceptance Criteria
- `_workspace/product_scope.md` accurately reflects current approved MVP scope
- All `priority:p0` issues have binary acceptance criteria
- Demo script is walkable end-to-end in ≤30 seconds
- No issue in backlog requires a forbidden technology

## Common Failure Modes
- Accepting vague "AI-powered X" features without defining the bounded service function
- Not cutting low-priority issues before sprint planning starts
- Demo script drifts from what's actually built — update it after every merge
