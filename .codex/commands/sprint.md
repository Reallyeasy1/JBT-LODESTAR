---
name: sprint
description: Route ready Lodestar GitHub issues to Codex role playbooks using the project sprint workflow.
---

# /sprint - Lodestar Sprint Launcher

Use this playbook to kick off the next development sprint by routing GitHub issues to the right specialist roles.

Arguments may be issue numbers, priority filters, or area filters:

- `#12 #15 #17`: work only those issues
- `p0`: work only `priority:p0`
- `frontend`, `data`, `ai`, `safety`, `okf`: filter by `area:*`
- no args: choose the next ready issues in dependency order

## Step 0 - Context Check

1. Read `_workspace/agent_handoff.md` and summarize current state.
2. Read `_workspace/technical_plan.md` and note blockers/deviations.
3. Check in-progress count:

```bash
gh issue list --label "status:in-progress" --json number,title,labels --state open
```

If 3 or more issues are already in progress, stop and report. Do not assign more.

4. Check schema blockers:

```bash
gh issue list --label "blocked-by-schema,status:blocked" --state open --json number,title
```

If a `needs-contract` issue is still open, do not start dependent `area:frontend` or `area:ai` issues.

## Step 1 - Fetch Ready Issues

For explicit issue numbers:

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

Apply filters. Skip assigned issues.

## Step 2 - Route Issues

| Issue labels present | Route to |
|---|---|
| `area:data` or `needs-contract` | `data-backend-engineer` |
| `area:ai` or `area:backend` | `ai-workflow-engineer` |
| `area:frontend` | `fullstack-builder` |
| `area:okf` or `parallel-safe` | `ai-workflow-engineer` |
| `area:safety` or `area:qa` | `safety-qa-engineer` |
| `agent:product-architect` | `product-architect` |

Dependency order:

1. `area:data` / `needs-contract`
2. `area:ai` / `area:backend`
3. `area:frontend` only after open `needs-contract` issues are done
4. `area:safety` / `area:qa` after implementation PRs are open

Cap: choose at most 3 issues total across current and new in-progress work.

## Step 3 - Claim And Launch

For each selected issue:

```bash
gh issue edit <N> \
  --add-assignee @me \
  --add-label "status:in-progress" \
  --remove-label "status:ready"
```

Post a plan comment:

```txt
## Plan
- Role: <role-name>
- Files to touch: <list>
- Approach: <1-2 sentences>
- Dependencies: <list or none>
```

Then follow the matching playbook:

- `data-backend-engineer`: `.codex/agents/data-backend-engineer.md`
- `ai-workflow-engineer`: `.codex/agents/ai-workflow-engineer.md`
- `fullstack-builder`: `.codex/agents/fullstack-builder.md`
- `safety-qa-engineer`: `.codex/agents/safety-qa-engineer.md`
- `product-architect`: `.codex/agents/product-architect.md`

## Step 4 - Collect

After work completes, collect status:

- PR link or files changed
- Tests/checks run
- Blockers
- Follow-up issues

For blockers, add `status:blocked` and an appropriate `blocked-by-*` label.

## Step 5 - Handoff Update

Update `_workspace/agent_handoff.md`:

```txt
## Sprint <date>
### Completed this run
- Issue #N - <title> - PR #X - role: <name>

### In review
- Issue #N - <title> - waiting for safety-qa-engineer

### Queued next
- Issue #N - <title> - unblocked by: <what>

### Blockers
- Issue #N - blocked by: <root cause>
```

Report three lines to the user:

- What was launched
- What is in review
- What is blocked or queued next
