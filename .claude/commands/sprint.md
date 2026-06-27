# /sprint — Lodestar Sprint Launcher

Kick off the next development sprint by routing GitHub Issues to the correct specialist agents.

Arguments (optional): `$ARGUMENTS`
- Issue numbers: `/sprint #12 #15 #17` — work only these issues
- Priority filter: `/sprint p0` — work only `priority:p0` issues
- Area filter: `/sprint frontend` — work only `area:frontend` issues
- No args: auto-select the next ready issues following dependency order

---

## Step 0 — Sync with remote main (always first)

Pull the latest `main` so the handoff doc, issue state, and branch base are current:
```bash
git checkout main
git pull origin main --no-rebase
```
- If the working tree is dirty and the pull is blocked: **stop and report** — do not stash or discard the user's uncommitted work. Let the user resolve it.
- If the pull reports conflicts: **stop and report** — surface the conflicting files to the user.
- On clean fast-forward or "Already up to date": continue to Step 1.

---

## Step 1 — Context Check

1. Read `_workspace/agent_handoff.md` if it exists — summarise what was last completed and what's queued
2. Read `_workspace/technical_plan.md` if it exists — note any open blockers or deviations
3. Check current in-progress count:
   ```bash
   gh issue list --label "status:in-progress" --json number,title,labels --state open
   ```
   If ≥3 issues are already in-progress: **stop, report to user, do not assign more.**

4. Check for schema-blocking dependencies:
   ```bash
   gh issue list --label "blocked-by-schema,status:blocked" --state open --json number,title
   ```
   If a `needs-contract` issue is still open, do not start any `area:frontend` or `area:ai` issues that depend on it.

---

## Step 2 — Fetch Ready Issues

If specific issue numbers were given in `$ARGUMENTS`, fetch only those:
```bash
gh issue view <N> --json number,title,labels,body,assignees
```

Otherwise fetch the open ready pool:
```bash
gh issue list \
  --label "status:ready" \
  --state open \
  --json number,title,labels,body,assignees \
  --limit 15
```

Apply argument filters if present:
- `p0` → keep only issues with `priority:p0`
- `frontend` / `data` / `ai` / `safety` / `okf` → keep only matching `area:` label
- **Hard rule: remove any issue where `assignees` is non-empty from the candidate list.** Never assign yourself to an issue someone else has already claimed.

---

## Step 3 — Route Issues to Agents

Apply this routing table (first matching row wins):

| Issue labels present | Assign to agent |
|---|---|
| `area:data` or `needs-contract` | `data-backend-engineer` |
| `area:ai` or `area:backend` | `ai-workflow-engineer` |
| `area:frontend` | `fullstack-builder` |
| `area:okf` or `parallel-safe` | `ai-workflow-engineer` |
| `area:safety` or `area:qa` | `safety-qa-engineer` |
| `agent:product-architect` | `product-architect` |

**Dependency order** — enforce strictly:
1. `area:data` / `needs-contract` issues first
2. `area:ai` / `area:backend` next
3. `area:frontend` only after all open `needs-contract` issues are `status:done`
4. `area:safety` / `area:qa` last (after implementation PRs are open)

Cap: select at most **3 issues** total (in-progress count + new assignments ≤ 3).
Prefer `parallel-safe` issues when launching multiple agents simultaneously.

---

## Step 4 — Claim and Launch

For each selected issue:

1. **Re-verify the issue is still unassigned** (the list in Step 2 may be stale):
   ```bash
   gh issue view <N> --json assignees,labels
   ```
   - If `assignees` is non-empty → **skip this issue entirely**, log "Issue #N already claimed by <login> — skipping", and move to the next candidate.
   - If the issue no longer has `status:ready` → **skip**, same reason.
   - Only proceed to claim if `assignees` is empty AND `status:ready` is still present.

2. Claim the issue:
   ```bash
   gh issue edit <N> \
     --add-assignee @me \
     --add-label "status:in-progress" \
     --remove-label "status:ready"
   ```

3. Post a plan comment:
   ```bash
   gh issue comment <N> --body "## Plan
   - Agent: <agent-name>
   - Files to touch: <list>
   - Approach: <1-2 sentences>
   - Dependencies: <list or none>"
   ```

3. Invoke the skill matching the agent:
   - `data-backend-engineer` → invoke `lodestar-data-backend` skill
   - `ai-workflow-engineer` → invoke `lodestar-ai-workflows` skill
   - `fullstack-builder` → invoke `lodestar-fullstack-build` skill
   - `safety-qa-engineer` → invoke `lodestar-safety-qa` skill
   - `product-architect` → invoke `lodestar-product-planning` skill

   Launch each as a **subagent with `run_in_background: true`** when dispatching more than one.
   Pass to each subagent: the issue number, title, body, and acceptance criteria.
   Instruct each agent to run `git checkout main && git pull origin main` before
   creating its branch, so the branch is based on the latest remote `main`
   (matches `lodestar-github-workflow` skill).

---

## Step 5 — Wait and Collect

After all subagents complete:
- Collect each agent's completion report (PR link, files changed, any blockers hit)
- For any BLOCKER reported: add `status:blocked` + `blocked-by-*` label to issue, note root cause

---

## Step 6 — Handoff Update

Update `_workspace/agent_handoff.md`:
```
## Sprint <date>
### Completed this run
- Issue #N — <title> — PR #X — agent: <name>

### In review
- Issue #N — <title> — waiting for safety-qa-engineer

### Queued next (status:ready)
- Issue #N — <title> — unblocked by: <what>

### Blockers
- Issue #N — blocked by: <root cause>
```

**Update `CHANGELOG.md` (single-writer step — orchestrator only):**
For each PR merged this run:
1. Read the PR body's `## Changelog Entry` line
2. If it is "none" or missing, skip
3. Otherwise append it under the correct `[Unreleased]` heading (`Added` / `Changed` / `Fixed` / `Removed`) in `CHANGELOG.md` at the repo root
4. Commit `CHANGELOG.md` and `_workspace/agent_handoff.md` together in a single commit to `main`:
   ```bash
   git add CHANGELOG.md _workspace/agent_handoff.md
   git commit -m "chore: update changelog + handoff after sprint run [date]"
   git push origin main
   ```

> Agents never touch `CHANGELOG.md` on their feature branches. This single-writer pattern prevents merge conflicts across parallel branches.

Then report a 3-line summary to the user:
- What was launched
- What's in review
- What's blocked or queued next
