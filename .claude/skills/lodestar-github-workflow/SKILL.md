---
name: lodestar-github-workflow
description: Defines the GitHub Issues task-queue workflow for the Lodestar development team. Use when claiming a GitHub issue, creating a branch, opening a PR, updating issue status, or resolving a conflict. All Lodestar agents must follow this workflow for parallel-safe concurrent development.
---

# Lodestar GitHub Workflow Skill

## Purpose
GitHub Issues are the shared task queue for all Lodestar agents and human teammates working concurrently. This skill defines the exact protocol every agent must follow to claim, implement, review, and close work safely without conflicting with others.

---

## 1. Issue Selection Protocol

**Only pick issues that match ALL of these:**
- `status:ready` label is set
- Issue is unassigned (no GitHub assignee)
- At least one label matches your `agent:*` or `area:*` label
- Issue is NOT labelled `status:blocked`

**Preference order when multiple valid issues exist:**
1. `parallel-safe` issues (no file conflicts with active branches)
2. Issues matching your specific `agent:*` label
3. Issues matching your `area:*` label
4. Highest `priority:*` (p0 > p1 > p2)
5. Smallest `size:*` (s > m > l) if priority is equal

**Never pick:**
- `status:blocked` issues — wait for the blocking issue to close first
- Assigned issues — unless orchestrator explicitly directs you to take over
- Issues outside your area without orchestrator approval

---

## 2. Claim Protocol

Before writing any code:

1. **Check issue is still unassigned** — refresh GitHub, do not assume
2. **Assign yourself** via `gh issue edit N --add-assignee @me`
3. **Add `status:in-progress`, remove `status:ready`**:
   ```bash
   gh issue edit N --add-label "status:in-progress" --remove-label "status:ready"
   ```
4. **Comment your plan** on the issue:
   ```
   ## Plan
   - Files I will touch: [list]
   - Approach: [1-3 sentences]
   - Estimated scope: [s/m/l]
   - Dependencies I need: [list or "none"]
   ```
5. **Create branch** from main:
   ```bash
   git checkout main && git pull origin main
   git checkout -b issue-<N>-<short-slug>
   # Example: issue-3-event-dashboard
   ```

---

## 2.5 Spec Protocol (hard gate — runs after Claim, before Implementation)

Every issue requires a critic-APPROVED spec before any code is written.

1. Check for an existing approved spec:
   ```bash
   ls specs/issue-<N>-*.md 2>/dev/null
   ```
   - If the Critic Log shows APPROVED → skip to §3.
   - Otherwise → author or continue the spec now.

2. Invoke the `lodestar-spec-driven` skill with the issue number.
   - It will author `specs/issue-<N>-<slug>.md` from `specs/TEMPLATE.md`
   - Invoke the `spec-critic` agent for a critique loop
   - Loop until the critic returns APPROVE and stamps the Critic Log

3. **Do not create a branch or write any code until the spec's Critic Log shows APPROVED.**

---

## 3. Implementation Protocol

1. Read the issue's acceptance criteria — these are your definition of done
2. Read the approved spec — `specs/issue-<N>-<slug>.md` — this is your implementation contract
2. Read the files listed in the issue's "Files likely touched" section
3. Make minimal changes — do not touch files outside the issue scope
4. Do not refactor unrelated code found during implementation
5. Commit with issue reference:
   ```bash
   git commit -m "feat: [description] — closes #N"
   ```
6. Keep commits atomic: one logical change per commit

---

## 4. PR Protocol

1. Push branch and open PR:
   ```bash
   git push -u origin issue-<N>-<short-slug>
   gh pr create \
     --title "feat: [description] — closes #N" \
     --body "$(cat <<'EOF'
   ## Summary
   [What was built and why]

   ## Spec
   - Spec: `specs/issue-<N>-<slug>.md`
   - [ ] Spec was critic-APPROVED before implementation began

   ## Changelog Entry
   <!-- One line transcribed by orchestrator into CHANGELOG.md [Unreleased] after merge.
        Do NOT edit CHANGELOG.md on your branch — orchestrator is the single writer. -->
   - Added: [short description] (#N)

   ## Files Changed
   - [file]: [what changed]

   ## Test Plan
   - [ ] [manual step 1]
   - [ ] [manual step 2]

   ## Screenshots
   [For UI changes — required]

   ## Risks
   [Any known edge cases or follow-up needed]

   ## Dependencies
   Closes #N
   EOF
   )"
   ```

2. Move issue to `status:review`:
   ```bash
   gh issue edit N --add-label "status:review" --remove-label "status:in-progress"
   ```

3. Tag `safety-qa-engineer` for review on any PR touching `src/ai/`, `src/services/`, or `okf/`

---

## 5. Completion Protocol

After QA passes:

1. Orchestrator or reviewer merges PR
2. Close issue via PR (auto-close with "closes #N" in PR body)
3. Move to `status:done`:
   ```bash
   gh issue edit N --add-label "status:done" --remove-label "status:review"
   ```
4. **Orchestrator transcribes the PR's `## Changelog Entry` line into `CHANGELOG.md` `[Unreleased]`** under the correct heading (`Added` / `Changed` / `Fixed` / `Removed`), then commits `CHANGELOG.md` to `main` together with the `agent_handoff.md` handoff update.
   - **Agents never edit `CHANGELOG.md` on their feature branch** — the orchestrator is the single writer on `main`, which eliminates merge conflicts across parallel branches.
   - If a PR has no Changelog Entry or says "none", skip (chore/docs PRs).
5. Check if any `blocked-by-*` issues are now unblocked:
   ```bash
   gh issue list --label "blocked-by-schema" --state open  # if schema issue just closed
   ```
6. Comment on newly unblocked issues with unblock notice and move to `status:ready`

---

## 6. Conflict Protocol

**Branch conflict (same file changed in another branch):**
1. Stop work on conflicting file
2. Rebase from main:
   ```bash
   git fetch origin && git rebase origin/main
   ```
3. If conflict is unresolvable, comment on issue with blocker and tag orchestrator

**Contract changed mid-work (API shape, Prisma schema):**
1. Stop implementation
2. Add `status:blocked` and `blocked-by-api` or `blocked-by-schema` to issue
3. Comment: what changed, what's broken, what's needed to unblock
4. Notify orchestrator

**Issue scope is too large:**
1. Stop and do not implement the whole issue in one PR
2. Comment on issue proposing a split into 2–3 sub-issues
3. Orchestrator creates sub-issues; original issue becomes parent/epic

---

## Label Reference

### Status labels
| Label | Meaning |
|-------|---------|
| `status:ready` | Available to claim — no assignee, dependencies met |
| `status:in-progress` | Claimed and actively being worked |
| `status:blocked` | Cannot proceed — see blocking label |
| `status:review` | PR open, waiting for QA/human review |
| `status:done` | Merged and closed |

### Area labels
`area:frontend` · `area:backend` · `area:data` · `area:ai` · `area:safety` · `area:qa` · `area:okf` · `area:docs` · `area:devops`

### Agent labels
`agent:product-architect` · `agent:fullstack-builder` · `agent:data-backend-engineer` · `agent:ai-workflow-engineer` · `agent:safety-qa-engineer`

### Priority labels
`priority:p0` (must ship first) · `priority:p1` · `priority:p2` (nice to have)

### Size labels
`size:s` (≤4h) · `size:m` (1 day) · `size:l` (2+ days)

### Qualifier labels
`parallel-safe` — can be worked on simultaneously with any other issue
`needs-contract` — produces a contract (schema, API shape) others depend on
`blocked-by-schema` — needs schema migration to complete first
`blocked-by-api` — needs API route/service contract first
`blocked-by-design` — needs product/UX decision first

---

## Quick Reference Commands

```bash
# List ready issues for your area
gh issue list --label "status:ready,area:frontend" --state open

# Claim an issue
gh issue edit N --add-assignee @me --add-label "status:in-progress" --remove-label "status:ready"

# Create branch
git checkout -b issue-N-short-slug

# Move to review
gh issue edit N --add-label "status:review" --remove-label "status:in-progress"

# List blocked issues (check after completing a schema issue)
gh issue list --label "blocked-by-schema" --state open
```
