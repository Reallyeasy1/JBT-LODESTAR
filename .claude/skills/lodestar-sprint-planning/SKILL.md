---
name: lodestar-sprint-planning
description: Runs a structured sprint planning session for Lodestar. Asks all required questions BEFORE doing any planning work, then selects issues, assigns agents, sets dependency order, and writes the sprint plan to _workspace/agent_handoff.md. Use when starting a new sprint, re-planning mid-sprint, or asking "what should we build this sprint?" or "plan the next sprint." Always ask questions first — never skip straight to issue selection.
---

# Lodestar Sprint Planning Skill

## Purpose
Produce a concrete sprint plan: goal, selected issues, agent assignments, parallel/serial groupings, and a day-by-day rough sequence. All grounded in answers the user gives upfront.

---

## PHASE 1 — Ask All Questions First (mandatory, no skipping)

Before reading any files or selecting any issues, ask the user ALL of the following questions in one go. Do not split them across multiple messages. Do not start planning until every question has an answer (user may write "skip" or "default" for optional ones).

### Required questions

**Q1 — Sprint goal**
What should be shippable or demonstrable at the end of this sprint?
*(e.g. "The full demo vertical slice works end-to-end" or "Schema + seeded event dashboard")*

**Q2 — Sprint length**
How many days is this sprint?
*(e.g. 3, 5, 7, 14)*

**Q3 — Concurrent capacity**
How many agents or teammates will be working concurrently?
*(e.g. 1 solo, 2, 3, full team of 5)*

**Q4 — Available agents**
Which agents are available for this sprint?
- [ ] product-architect
- [ ] fullstack-builder
- [ ] data-backend-engineer
- [ ] ai-workflow-engineer
- [ ] safety-qa-engineer
*(Default: all five)*

**Q5 — Must-have issues**
Are there any issues that MUST be completed this sprint, regardless of priority?
*(List issue numbers or titles, or "none")*

**Q6 — Explicit exclusions**
Are there any issues to exclude from this sprint entirely?
*(List issue numbers or titles, or "none")*

**Q7 — Hard constraints**
Any external deadlines, demo dates, or blockers I should know about?
*(e.g. "Demo on Friday", "MySQL not set up yet", "none")*

**Q8 — Current codebase state**
What has already been built or merged?
*(e.g. "Nothing yet", "Schema done, no pages", or list issue numbers already closed)*

**Q9 — Parallel safety preference**
Should agents work in parallel where possible, or do you prefer serial (one at a time, easier to review)?
*(parallel / serial / default: parallel where dependency order allows)*

**Q10 — QA gate**
Should every issue go through `safety-qa-engineer` review before closing, or only AI-touching issues?
*(every issue / AI-touching only / skip for now)*

---

## PHASE 2 — Read Current State (after answers received)

Only after the user has answered all questions:

1. Read `_workspace/issue_backlog.md` — full issue list with dependencies
2. Read `_workspace/agent_handoff.md` — what's already done
3. Read `_workspace/technical_plan.md` — phase completion status
4. Check GitHub for any `status:done` or `status:in-progress` issues (if gh is available):
   ```bash
   gh issue list --state all --limit 50 2>/dev/null || echo "gh not available"
   ```

---

## PHASE 3 — Build Sprint Plan

Using the user's answers, produce the sprint plan:

### 3a. Filter issue pool
- Remove issues the user excluded (Q6)
- Remove issues already `status:done` (Q8)
- Add issues the user marked must-have (Q5) regardless of dependency state
- Respect available agents (Q4) — don't assign to unavailable agents

### 3b. Respect dependency order
Issues cannot start until their blockers are resolved. Enforce:
```
#2 (schema) must complete before #3, #4, #5, #6, #7, #8
#4 (ranking svc) must complete before #5 (ranking UI)
#6 (briefing svc) + #8 (followup svc) must complete before #7 (contact page)
```

### 3c. Group into parallel tracks
If parallel (Q9 = parallel):
- Track A: data-backend-engineer → schema + seed (#2)
- Track B (parallel-safe immediately): product-architect (#1), ai-workflow-engineer (#9), safety-qa-engineer (#10, #11)
- Track C (after #2): ai-workflow-engineer (#4, #6, #8 in sequence or parallel)
- Track D (after service contracts): fullstack-builder (#3, #5, #7 in sequence)

If serial (Q9 = serial): order issues strictly by dependency, one at a time.

### 3d. Fit to sprint length
Based on issue sizes and sprint days (Q2):
- `size:s` = ~0.5 days
- `size:m` = ~1 day
- `size:l` = ~2 days

Cap the sprint at: `(sprint days × concurrent agents)` agent-days total. Drop lowest-priority issues that don't fit. Flag them as "deferred to next sprint."

### 3e. Apply QA gate (Q10)
If "every issue": add a `safety-qa-engineer` review step after every PR.
If "AI-touching only": add review gate after #4, #6, #8 only.
If "skip": note this as a risk in the plan.

---

## PHASE 4 — Output Sprint Plan

Print the sprint plan in this format:

```
## Sprint [N] Plan
**Goal:** [Q1 answer]
**Length:** [Q2] days
**Capacity:** [Q2 × Q3] agent-days
**Agents:** [Q4 list]

### Sprint Backlog (ordered)
| # | Issue | Size | Agent | Depends on | Track |
|---|-------|------|-------|-----------|-------|
| 2 | Schema + seed | m | data-backend-engineer | — | A |
| 1 | Product scope doc | s | product-architect | — | B (parallel) |
...

### Parallel Tracks
**Day 1–2:** [what runs in parallel]
**Day 3–4:** [what unlocks]
...

### Deferred to Next Sprint
- #X: [reason]

### Risks
- [any constraint from Q7 that affects the plan]

### QA Gates
- [when safety-qa-engineer reviews]
```

---

## PHASE 5 — Write to _workspace and Offer GitHub Actions

1. Update `_workspace/agent_handoff.md` with the sprint plan
2. Ask: **"Should I create/update the GitHub issues now with the sprint labels?"**
   - If yes: output the `gh issue edit` commands to set labels, then run them
   - If no: leave as draft

---

## Anti-Overengineering Rules
- Do not add issues to the sprint that aren't in the backlog without user approval
- Do not extend sprint length to fit more issues — defer instead
- Do not assign an issue to an unavailable agent (Q4)
- Do not skip Phase 1 questions even if "it seems obvious" — the user must confirm

## Common Failure Modes
- Skipping Q8 and assuming nothing is done → double-planning already-merged work
- Ignoring Q7 constraints → plan that breaks at demo day
- Stuffing too many issues → every issue becomes `status:in-progress`, none finish
- Forgetting QA gate → merging AI code without review
