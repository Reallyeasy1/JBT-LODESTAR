# specs/ — Lodestar Issue Specifications

Every GitHub issue requires a written spec here before any code is written.
The spec is authored by the implementing agent and must be **critic-APPROVED** by the `spec-critic` agent before a branch is created.

---

## Naming convention

```
specs/issue-<N>-<short-slug>.md
```

Examples:
- `specs/issue-4-ranking-service.md`
- `specs/issue-7-contact-detail-page.md`

---

## Lifecycle

```
1. Issue claimed (gh issue edit --add-assignee @me)
2. Author copies specs/TEMPLATE.md → specs/issue-<N>-<slug>.md and fills all sections
3. Author invokes the spec-critic agent (or runs /spec <N>)
4. Critic returns APPROVE or REVISE with BLOCKER/QUESTION/SUGGESTION findings
5. Author resolves findings, revises spec, re-submits if REVISE
6. Loop until APPROVE — critic stamps the Critic Log
7. *** Only now does the author create a branch and write code ***
8. Spec file is committed in the same PR as the implementation
```

**Hard gate:** no branch, no code until the Critic Log shows APPROVED.

---

## What lives here

- `TEMPLATE.md` — the canonical spec shape (do not delete)
- `issue-<N>-<slug>.md` — one approved spec per issue

## What does NOT live here

- Agent run logs → MySQL `AgentRun` table
- Planning documents → `_workspace/`
- OKF knowledge → `okf/`
- User contact data → never in the repo

---

## Commands

```bash
# Run the spec + critic loop for an issue
/spec <N>

# Or invoke the critic manually on an existing draft
# (invoke the lodestar-spec-critic skill against specs/issue-<N>-<slug>.md)
```

---

## Maintenance

Specs are versioned with the code they describe. They are committed once (in the implementing PR) and generally not edited after APPROVE, except to add post-merge learnings as a note at the bottom.
