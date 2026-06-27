---
name: lodestar-spec-driven
description: Pre-implementation spec authoring for Lodestar. Run this before writing any code for a GitHub issue. Copies specs/TEMPLATE.md to specs/issue-<N>-<slug>.md, guides the agent through filling every section, then invokes the spec-critic for a critique loop until APPROVE. Only after critic-APPROVE may a branch be created and code written. Use when told to write a spec, when implementing any issue, when spec-driven is mentioned, or when the sprint or github-workflow skill triggers the spec gate.
---

# Lodestar Spec-Driven Skill

## Purpose

Author a complete, buildable spec for a GitHub issue and get it critic-APPROVED before touching any code. This is **Step 0** of every implementation task in Lodestar.

**Hard gate:** no `git checkout -b`, no file edits in `src/`, `prisma/`, or `okf/` until the spec's Critic Log shows APPROVED.

---

## Step 0 — Check for an existing spec

```bash
ls specs/issue-<N>-*.md 2>/dev/null
```

- If a spec already exists AND its Critic Log shows APPROVED → skip to implementation (this skill has already done its job).
- If a spec exists but is DRAFT or IN-REVIEW → skip to Step 3 (invoke the critic on the existing draft).
- If no spec exists → continue to Step 1.

---

## Step 1 — Read the issue

```bash
gh issue view <N> --json number,title,body,labels,assignees
```

Read and understand:
- The exact goal and acceptance criteria
- The labels (area, priority, size, agent)
- Any stated dependencies

Also read:
- `CLAUDE.md` (forbidden tech, architecture rules)
- `prisma/schema.prisma` (if the issue touches data)
- `_workspace/technical_plan.md` (current service contracts)
- Any existing files the issue says it will modify

---

## Step 2 — Author the spec

Copy the template and fill every section:

```bash
# Determine slug from issue title (lowercase, hyphens)
cp specs/TEMPLATE.md specs/issue-<N>-<slug>.md
```

Fill each section honestly:
- **Problem & Goal** — one sentence, user-outcome framing
- **Non-goals** — at least one explicit cut
- **Approach** — design in prose, no code yet
- **Data / contract changes** — actual field names, signatures, types (or "None")
- **API / UI contract** — route method/path/shapes, component props (or "None")
- **Acceptance criteria** — binary, testable, covers everything in the issue
- **Test plan** — concrete steps to verify each criterion
- **Risks & mitigations** — at least one row (or justified "None identified")
- **Open questions** — anything you can't answer from the issue + codebase alone

**Self-check before calling the critic:**
- No section left as `[Fill here]` or `TBD`
- No forbidden tech in Approach or Data sections
- Every acceptance criterion is binary (would a stranger agree on pass/fail?)
- Contracts are consistent with existing schema and service signatures

---

## Step 3 — Invoke the spec-critic

Invoke the `spec-critic` agent (or invoke the `lodestar-spec-critic` skill directly):

Pass to the critic:
- Issue number
- Path to the draft spec: `specs/issue-<N>-<slug>.md`

The critic will:
1. Apply its rubric
2. Ask clarifying questions — **answer them directly if you can resolve from issue/codebase context**
3. If a question is a product decision you can't resolve → escalate to the user via AskUserQuestion
4. Revise the spec based on answers, re-invoke the critic

Loop until the critic returns **Verdict: APPROVE**.

---

## Step 4 — Gate check (after APPROVE)

Verify the Critic Log in `specs/issue-<N>-<slug>.md` shows:
```
| <round> | YYYY-MM-DD | APPROVED | ...
```

Only then proceed to the `lodestar-github-workflow` §3 Implementation Protocol:
```bash
git checkout main && git pull origin main
git checkout -b issue-<N>-<slug>
```

The approved spec is the implementation contract. Code must match it. If during implementation you discover the spec needs to change (a wrong assumption, a missed edge case), stop — revise the spec, re-invoke the critic, get re-APPROVED, then continue.

---

## Anti-patterns (hard stops)

- **Skipping the spec for "simple" issues** — every issue, no exceptions.
- **Writing "TBD" in any section** — the critic will REVISE immediately.
- **Copying acceptance criteria verbatim from the issue without making them binary** — the issue may say "works correctly"; the spec must say "returns HTTP 200 with a `{ rankingId }` body."
- **Starting code before critic-APPROVE** — this is the most expensive anti-pattern. Fix is always: stop, finish the spec, get APPROVE, then code.
