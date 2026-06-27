# PR Review Skill

Performs a thorough, structured code review of the current branch (or a specified PR) against a base branch. After producing the review, always offers to post findings directly to the GitHub PR when a PR number is known. Pass `--post` to skip the confirmation prompt.

---

## Argument Parsing

Parse `$ARGUMENTS` before doing anything else:

| Pattern | Meaning |
|---|---|
| *(empty)* | Review current branch, infer base automatically |
| `main` | Use `main` as the base branch |
| `--base <branch>` | Use `<branch>` as the base branch |
| `--pr <N>` | Fetch PR #N metadata and use its base branch |
| `--focus security` | Emphasis on security, auth, injection findings |
| `--focus tests` | Emphasis on test coverage and missing tests |
| `--post` | Skip the "post to GitHub?" confirmation and post immediately after review |

Flags can be combined: `/pr-review --pr 42 --focus security --post`

Extract:
- `BASE_ARG` — value after `--base` or a bare branch name (not a flag)
- `PR_NUMBER` — value after `--pr`
- `FOCUS` — value after `--focus` (optional, one of: `security`, `tests`, `performance`, `all`)
- `AUTO_POST` — true if `--post` is present (skips confirmation; posting is always offered when a PR is known)

---

## Step 1 — Collect Context

Run the context script:
```bash
bash .claude/skills/pr-review/scripts/collect-pr-context.sh "$BASE_ARG" "$PR_NUMBER"
```

If the script is not executable or unavailable, collect context manually with these commands:

```bash
# Current branch
git branch --show-current

# Changed files
git diff --name-status origin/main...HEAD

# Commits
git log --oneline origin/main...HEAD

# Diff stat
git diff --stat origin/main...HEAD

# Full diff (the most important input)
git diff origin/main...HEAD

# PR metadata (if gh available)
gh pr view --json number,title,body,state,labels

# CI status (if gh available)
gh pr checks
```

Base branch inference order (stop at first that works):
1. `BASE_ARG` from arguments
2. PR base from `gh pr view --json baseRefName` (if `--pr` given or current branch has a PR)
3. `origin/main`
4. `origin/master`
5. `main`
6. `master`

If none resolve: stop and ask the user to provide the base explicitly.

---

## Step 2 — Read the Checklist

Read `.claude/skills/pr-review/review-checklist.md` in full before starting analysis.

If `--focus` is set, weight findings accordingly — but do not skip categories entirely. A focused review emphasises certain categories, not excludes others:

| Focus | Weighted categories |
|---|---|
| `security` | Security Risks, Auth/AuthZ, Data Consistency, Migrations |
| `tests` | Missing Tests, Edge Cases, Correctness Bugs |
| `performance` | Performance Issues, Data Consistency, Observability |

---

## Step 3 — Analyse the Diff

Read the full diff carefully. For each changed file:

1. Understand what the change is trying to do (read surrounding context, not just the ±lines)
2. Apply every checklist category
3. Only flag issues that are **evidenced by the diff** — do not speculate about unchanged code unless the changed code directly depends on it
4. Do not invent line numbers — cite function names or code snippets instead

**Severity rules:**

| Severity | Meaning | Merge impact |
|---|---|---|
| `BLOCKER` | Causes data loss, security breach, or crash in normal use | Must fix before merge |
| `HIGH` | Likely bug or serious risk under realistic conditions | Should fix before merge |
| `MEDIUM` | Code smell, missing test, or minor risk | Fix in follow-up |
| `LOW` | Style, readability, minor improvement | Optional |
| `QUESTION` | Reviewer needs clarification to assess risk | Blocks confident verdict |
| `PRAISE` | Genuinely good decision worth calling out | No action needed |

**Noise rules (do not flag these):**
- Formatting differences unless the project has an enforced formatter that this violates
- Personal style preferences with no correctness impact
- Code outside the diff unless the changed code calls it in a broken way
- Theoretical edge cases that cannot occur given the calling context

---

## Step 4 — Write the Review

Use the template from `.claude/skills/pr-review/output-template.md`.

Fill every section. If a section has no findings, write "None." or "None found." — do not omit the section heading.

**Verdict rules:**
- `Do not merge` — any BLOCKER present, or confidence is Low and risk is high
- `Merge after fixes` — BLOCKERs resolved but HIGH findings remain, or unresolved QUESTIONs
- `Safe to merge` — no BLOCKER, no HIGH, QUESTIONs answered, tests exist for new behaviour

**Confidence rules:**
- `High` — full diff reviewed, CI passing, test coverage visible
- `Medium` — diff reviewed but CI unknown or tests unclear
- `Low` — diff reviewed but large surface area, no tests, or domain knowledge gap

---

## Step 5 — Post to GitHub PR

Run this step whenever `PR_NUMBER` is known (from `--pr N`, or auto-detected via `gh pr view --json number`).
If no PR number can be determined, skip and note: *"Run `/pr-review --pr <N>` to enable GitHub posting."*

1. Show the full review output first.
2. If `AUTO_POST` is **false**: ask **"Post these findings to GitHub PR #N? (yes/no)"** and wait.
   If `AUTO_POST` is **true** (`--post` was passed): proceed without asking.
3. If confirmed (or `AUTO_POST`):

   **BLOCKER and HIGH** — post as a PR review comment:
   ```bash
   gh pr review <PR_NUMBER> \
     --comment \
     --body "## Code Review — Action Required

   [BLOCKER and HIGH findings, one per section with file + code snippet reference]"
   ```

   For findings tied to a specific line, use an inline comment instead:
   ```bash
   gh api repos/{owner}/{repo}/pulls/<PR_NUMBER>/comments \
     -f body="<finding text>" \
     -f commit_id="$(gh pr view <PR_NUMBER> --json headRefOid -q .headRefOid)" \
     -f path="<relative/file/path>" \
     -f line=<line_number> \
     -f side="RIGHT"
   ```

   **MEDIUM, LOW, PRAISE** — one consolidated comment:
   ```bash
   gh pr comment <PR_NUMBER> --body "## Code Review — Notes & Praise

   ### Medium
   [findings or 'None.']

   ### Low / Style
   [findings or 'None.']

   ### Praise
   [findings or 'None.']"
   ```

4. If the user declines: print "No comments posted." and stop.

**Never approve or request-changes on the PR — comments only. Never edit source files.**

---

## Safety Constraints

- Read-only by default. The only write operations permitted are GitHub comment posts via `gh`, and only after explicit confirmation (or `--post` flag).
- Never run `git checkout`, `git reset`, `git apply`, or any command that modifies the working tree.
- Never modify files in `src/`, `prisma/`, `okf/`, or any source directory.
- If the diff is very large (>1000 lines), summarise the areas covered and note any sections that were sampled rather than read in full.
