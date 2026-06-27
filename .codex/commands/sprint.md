---
name: sprint
description: Route ready Lodestar GitHub issues to Codex role playbooks using the project sprint workflow.
---

# /sprint - Lodestar Sprint Launcher

Kick off the next development sprint by routing GitHub Issues to the correct specialist Codex role playbooks.

If the user asks to plan a sprint rather than launch ready work, use `.codex/skills/lodestar-sprint-planning.md` first. That skill asks required questions before selecting issues.

Arguments are optional:

- Issue numbers: `/sprint #12 #15 #17` - work only these issues
- Priority filter: `/sprint p0` - work only `priority:p0` issues
- Area filter: `/sprint frontend` - work only `area:frontend` issues
- No args: auto-select the next ready issues following dependency order

## Prerequisites

1. GitHub CLI is authenticated:

```bash
gh auth status
```

2. Issues have the right labels:

- A `status:` label. `status:ready` means claimable.
- An `area:` label. This determines the role assignment.

| `area:` label | Role assigned |
|---|---|
| `area:data` | `data-backend-engineer` |
| `area:ai` or `area:backend` | `ai-workflow-engineer` |
| `area:frontend` | `fullstack-builder` |
| `area:safety` or `area:qa` | `safety-qa-engineer` |
| `area:okf` or `parallel-safe` | `ai-workflow-engineer` |

## Step 0 - Context Check

Always run this first:

1. Read `_workspace/agent_handoff.md` if it exists. Summarize what was last completed and what is queued.
2. Read `_workspace/technical_plan.md` if it exists. Note open blockers or deviations.
3. Check current in-progress count:

```bash
gh issue list --label "status:in-progress" --json number,title,labels --state open
```

If 3 or more issues are already in progress, stop, report to the user, and do not assign more.

4. Check for schema-blocking dependencies:

```bash
gh issue list --label "blocked-by-schema,status:blocked" --state open --json number,title
```

If a `needs-contract` issue is still open, do not start any dependent `area:frontend` or `area:ai` issues.

## Step 1 - Fetch Ready Issues

If specific issue numbers were provided, fetch only those:

```bash
gh issue view <N> --json number,title,labels,body,assignees
```

Otherwise:

```bash
gh issue list \
  --label "status:ready" \
  --state open \
  --json number,title,labels,body,assignees \
  --limit 15
```

Apply argument filters if present:

- `p0`: keep only issues with `priority:p0`
- `frontend`, `data`, `ai`, `safety`, `okf`: keep only matching `area:` label
- Skip any issue that already has an assignee

## Step 2 - Route Issues To Roles

Apply this routing table. First matching row wins.

| Issue labels present | Route to |
|---|---|
| `area:data` or `needs-contract` | `data-backend-engineer` |
| `area:ai` or `area:backend` | `ai-workflow-engineer` |
| `area:frontend` | `fullstack-builder` |
| `area:okf` or `parallel-safe` | `ai-workflow-engineer` |
| `area:safety` or `area:qa` | `safety-qa-engineer` |
| `agent:product-architect` | `product-architect` |

Enforce this dependency order strictly:

1. `area:data` / `needs-contract` issues first.
2. `area:ai` / `area:backend` next.
3. `area:frontend` only after all open `needs-contract` issues are `status:done`.
4. `area:safety` / `area:qa` last, after implementation PRs are open.

Cap: select at most 3 issues total, counting current in-progress plus new assignments.
Prefer `parallel-safe` issues when launching multiple roles simultaneously.

Typical fresh-project sprint sequence:

```txt
Sprint 1: area:data      - schema, migrations, seed data
Sprint 2: area:ai        - AI services, Zod schemas, OKF files
Sprint 3: area:frontend  - pages, components, API routes
Sprint 4: area:qa        - safety review, contract verification
```

## Step 3 - Claim And Launch

For each selected issue:

1. Claim the issue:

```bash
gh issue edit <N> \
  --add-assignee @me \
  --add-label "status:in-progress" \
  --remove-label "status:ready"
```

2. Post a plan comment:

```bash
gh issue comment <N> --body "## Plan
- Role: <role-name>
- Files to touch: <list>
- Approach: <1-2 sentences>
- Dependencies: <list or none>"
```

3. Follow the matching playbook:

- `data-backend-engineer`: `.codex/agents/data-backend-engineer.md`
- `ai-workflow-engineer`: `.codex/agents/ai-workflow-engineer.md`
- `fullstack-builder`: `.codex/agents/fullstack-builder.md`
- `safety-qa-engineer`: `.codex/agents/safety-qa-engineer.md`
- `product-architect`: `.codex/agents/product-architect.md`

When Codex subagent execution is available and dispatching more than one issue, launch each role as a background subagent. Pass each subagent the issue number, title, body, labels, and acceptance criteria. If subagents are unavailable, process the selected issues serially using the same role playbooks.

## Step 4 - Wait And Collect

After all role work completes:

- Collect each completion report: PR link, files changed, checks run, blockers, and follow-ups.
- For any BLOCKER, add `status:blocked` plus an appropriate `blocked-by-*` label to the issue and note the root cause.

## Step 5 - Handoff Update

Update `_workspace/agent_handoff.md` in this format:

```txt
## Sprint <date>
### Completed this run
- Issue #N - <title> - PR #X - role: <name>

### In review
- Issue #N - <title> - waiting for safety-qa-engineer

### Queued next (status:ready)
- Issue #N - <title> - unblocked by: <what>

### Blockers
- Issue #N - blocked by: <root cause>
```

Then report a 3-line summary to the user:

- What was launched
- What is in review
- What is blocked or queued next

## Label Reference

### Status labels

| Label | Meaning |
|---|---|
| `status:ready` | Available to claim; unassigned, dependencies met |
| `status:in-progress` | Claimed and actively being worked |
| `status:blocked` | Cannot proceed; see blocking label |
| `status:review` | PR open, waiting for QA review |
| `status:done` | Merged and closed |

### Priority labels

`priority:p0` ships first. `priority:p1` follows. `priority:p2` is nice to have.

### Size labels

`size:s` is at most 4 hours. `size:m` is about 1 day. `size:l` is 2 or more days.

### Qualifier labels

| Label | Meaning |
|---|---|
| `parallel-safe` | Can run simultaneously with any other issue |
| `needs-contract` | Produces a schema/API contract others depend on |
| `blocked-by-schema` | Needs schema migration to complete first |
| `blocked-by-api` | Needs API contract to be finalized first |

## Troubleshooting

| Problem | Fix |
|---|---|
| 3 or more issues already in progress | Wait for current work to finish, or close stale in-progress issues on GitHub |
| Role picks the wrong issue | Check that the issue has the correct `area:` label |
| Frontend blocked | Close the `needs-contract` issue first, then re-run `/sprint` |
| No issues found | Verify issues have `status:ready` and no assignee |
| GitHub command fails | Run `gh auth status` and confirm the repo remote is correct |
