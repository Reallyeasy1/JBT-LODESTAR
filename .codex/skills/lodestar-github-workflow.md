---
name: lodestar-github-workflow
description: Defines the GitHub issue, branch, PR, status-label, and conflict workflow for Lodestar.
---

# Lodestar GitHub Workflow

Use this workflow when claiming issues, creating branches, opening PRs, updating issue status, or resolving conflicts.

## Issue Selection

Only pick issues that match all:

- `status:ready`
- unassigned
- matching `agent:*` or `area:*`
- not labelled `status:blocked`

Preference order:

1. `parallel-safe`
2. matching `agent:*`
3. matching `area:*`
4. highest priority: `p0`, then `p1`, then `p2`
5. smallest size: `s`, then `m`, then `l`

## Claim

```bash
gh issue edit N --add-assignee @me
gh issue edit N --add-label "status:in-progress" --remove-label "status:ready"
```

Comment:

```txt
## Plan
- Files I will touch:
- Approach:
- Estimated scope:
- Dependencies:
```

Create branch:

```bash
git checkout main
git pull origin main
git checkout -b issue-N-short-slug
```

## Implement

- Read acceptance criteria.
- Read files listed in issue scope.
- Keep changes minimal.
- Avoid unrelated refactors.
- Commit with issue reference:

```bash
git commit -m "feat: description - closes #N"
```

## PR

```bash
git push -u origin issue-N-short-slug
gh pr create --title "feat: description - closes #N" --body "<body>"
gh issue edit N --add-label "status:review" --remove-label "status:in-progress"
```

PR body should include:

- Summary
- Files changed
- Test plan
- Screenshots for UI
- Risks
- `Closes #N`

## Completion

After QA passes:

```bash
gh issue edit N --add-label "status:done" --remove-label "status:review"
```

Check whether any `blocked-by-*` issues are unblocked and move them to `status:ready` with a comment.

## Conflict Protocol

For branch conflicts:

```bash
git fetch origin
git rebase origin/main
```

If unresolvable, stop, mark the issue blocked, and notify orchestrator.

For contract changes, add `status:blocked` plus `blocked-by-api` or `blocked-by-schema`, and comment with what changed.
