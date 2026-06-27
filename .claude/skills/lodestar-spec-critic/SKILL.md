---
name: lodestar-spec-critic
description: Adversarial pre-implementation spec review for Lodestar. Invoked by the spec-critic agent to critique a draft spec file (specs/issue-<N>-<slug>.md) against a rubric. Asks clarifying questions to the author, returns APPROVE or REVISE, and stamps the Critic Log on approval. Use when reviewing a spec, when /spec <N> is running its critic loop, or when the sprint skill triggers the spec gate before launching an implementation agent. Never touches feature code.
---

# Lodestar Spec Critic Skill

## Purpose

Apply an adversarial rubric to a draft spec and engage in a structured question-and-answer loop with the spec author until the spec is unambiguous and buildable — or identify what must change.

---

## Step 1 — Gather context

Read these in order:
1. The GitHub issue: `gh issue view <N> --json number,title,body,labels`
2. The draft spec: `specs/issue-<N>-<slug>.md`
3. The template: `specs/TEMPLATE.md` (to verify all sections are present)
4. CLAUDE.md (forbidden technologies, architecture rules)
5. `prisma/schema.prisma` (for data-touching specs)
6. `_workspace/technical_plan.md` (for service contracts)
7. Any existing files the spec says it will modify (read only — understand current state)

---

## Step 2 — Apply the rubric

Check every item. Assign a severity (BLOCKER / QUESTION / SUGGESTION) to each failure.

### Section completeness
- [ ] All template sections are present and filled (no "TBD", no `[Fill here]` placeholders)
- [ ] Issue number, title, and labels match the actual GitHub issue
- [ ] Non-goals section explicitly names at least one thing NOT in scope

### Acceptance criteria
- [ ] Every criterion is binary (the outcome is objectively YES or NO — not "looks good", "feels right", "is reasonable")
- [ ] Every criterion in the issue body is addressed by a spec criterion (no regression)
- [ ] Criteria are independently testable (can pass one without all others passing)

### Forbidden technology check (against CLAUDE.md)
- [ ] No PostgreSQL (MySQL only via Prisma)
- [ ] No vector database, graph database
- [ ] No Kubernetes
- [ ] No LinkedIn scraping or LinkedIn API calls
- [ ] No auto-sending messages (all follow-ups must be drafts)
- [ ] No autonomous background agent loops
- [ ] No AI writing to the DB directly (always Zod-validated → draft → user review)

### Contract consistency
- [ ] Data / contract changes section is consistent with `prisma/schema.prisma` (no fields referenced that don't exist)
- [ ] API / UI contract section is internally consistent (request shape → response shape → what the frontend would receive)
- [ ] Service signatures are compatible with the calling code (existing callers won't break)
- [ ] If a new Prisma model is introduced: IDs use `String @id @default(uuid())`, long text uses `@db.Text`, cascades are explicit

### Scope
- [ ] The spec implements what the issue asks — no more, no less
- [ ] No feature from the "What Not To Do" section of CLAUDE.md is present
- [ ] No new infrastructure (queue, vector DB, Kubernetes) is implied

### Risk coverage
- [ ] At least one risk is identified (or "None identified" with a justification)

### Open questions
- [ ] All open questions from the template are either answered or explicitly flagged for escalation

---

## Step 3 — Question-and-answer loop

For each BLOCKER or QUESTION finding:

1. Present the finding to the author in this format:
   ```
   [BLOCKER | QUESTION] <Section name>
   Finding: <what is wrong or unclear>
   Why it matters: <risk if left unresolved>
   Needed: <what the author must add/change/answer>
   ```

2. Wait for the author's response.

3. If the author resolves it: strike through the finding, reduce its severity if partially resolved.

4. If the author cannot resolve a QUESTION (it's a product decision outside their authority): **escalate to the user** via AskUserQuestion. Do not APPROVE while an escalated question is unanswered.

5. After all BLOCKERs and QUESTIONs are resolved: re-verify the full rubric (SUGGESTIONs may remain open without blocking APPROVE).

---

## Step 4 — Emit verdict

### REVISE verdict

```
## Spec Critic Review — Round <N>
**Verdict: REVISE**

### BLOCKERs (must resolve before APPROVE)
1. [BLOCKER] <Section>: <finding>

### QUESTIONs (resolve or escalate to user)
1. [QUESTION] <Section>: <finding>

### SUGGESTIONs (optional)
1. [SUGGESTION] <Section>: <finding>
```

Return to Step 3 after the author revises.

### APPROVE verdict

When all BLOCKERs and QUESTIONs are resolved:

```
## Spec Critic Review — Round <N>
**Verdict: APPROVE**

All acceptance criteria are binary and complete. Contracts are internally consistent. No forbidden technology. Scope is bounded. All open questions resolved.
```

Then edit `specs/issue-<N>-<slug>.md`, appending to the `## Critic Log` table:
```markdown
| <round> | YYYY-MM-DD | APPROVED | All BLOCKERs and QUESTIONs resolved |
```

---

## Safety Constraints

- Read-only on all files except `specs/issue-<N>-<slug>.md` (Critic Log update only on APPROVE).
- Never modify `src/`, `prisma/`, `okf/`, or `_workspace/`.
- Never approve a spec that references forbidden technology, even if the rest is sound.
- Never skip the rubric to speed up approval — friction is the point.
