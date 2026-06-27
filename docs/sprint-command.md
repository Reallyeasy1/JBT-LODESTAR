# `/sprint` Command Tutorial

Dispatches specialist agents to work on the next ready GitHub Issues, routing each ticket to the correct agent based on its labels.

---

## Prerequisites

**1. Enable agent teams** (add to your shell profile):
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

**2. Authenticate the GitHub CLI:**
```bash
gh auth status
```

**3. Label your issues correctly.** Every issue needs:
- A `status:` label — `status:ready` means it's claimable
- An `area:` label — tells `/sprint` which agent to assign it to

| `area:` label | Agent assigned |
|---|---|
| `area:data` | `data-backend-engineer` |
| `area:ai` or `area:backend` | `ai-workflow-engineer` |
| `area:frontend` | `fullstack-builder` |
| `area:safety` or `area:qa` | `safety-qa-engineer` |
| `area:okf` or `parallel-safe` | `ai-workflow-engineer` |

---

## Basic Usage

Open Claude Code in the project directory and type:

```
/sprint
```

With filters:

```
/sprint p0           # only priority:p0 issues
/sprint #12 #15      # exactly these issue numbers
/sprint frontend     # only area:frontend issues
/sprint data         # only area:data issues
```

---

## What Happens During a Run

```
/sprint
  │
  ├── git pull origin main                     (sync local main with remote)
  ├── reads _workspace/agent_handoff.md        (what was done last session)
  ├── checks issues with status:in-progress    (stops if ≥3 already running)
  ├── fetches all status:ready issues
  │
  ├── picks up to 3 issues in dependency order:
  │     area:data → area:ai → area:frontend → area:safety
  │
  ├── for each issue:
  │     claims it on GitHub (status:in-progress)
  │     posts a plan comment on the issue
  │     launches the correct agent in the background
  │
  └── when agents finish:
        updates _workspace/agent_handoff.md
        reports: launched / in-review / blocked
```

---

## Dependency Order

`/sprint` enforces this order automatically:

| Phase | Area | Reason |
|---|---|---|
| 1st | `area:data` | Schema must be stable before anything else builds on it |
| 2nd | `area:ai` / `area:backend` | Services need schema to be final |
| 3rd | `area:frontend` | UI needs stable API contracts |
| Last | `area:safety` / `area:qa` | Reviews run after PRs are open |

`/sprint` will **refuse** to start `area:frontend` issues while any `needs-contract` issue is still open.

Typical sprint sequence for a fresh project:
```
Sprint 1:  area:data        ← schema, migrations, seed data
Sprint 2:  area:ai          ← AI services, Zod schemas, OKF files
Sprint 3:  area:frontend    ← pages, components, API routes
Sprint 4:  area:qa          ← safety review, contract verification
```

---

## Concurrency Limit

`/sprint` caps at **3 issues in-progress at once** (across all agents). This is intentional:
- More than 3 agents frequently hit file conflicts
- The dependency chain means most issues naturally block each other anyway
- API rate limits degrade performance past ~4 concurrent agents

---

## After Agents Finish

Run `/sprint` again. It reads `_workspace/agent_handoff.md`, skips anything already in-progress, and picks up the next batch. No manual tracking needed.

---

## Label Reference

### Status labels
| Label | Meaning |
|---|---|
| `status:ready` | Available to claim — unassigned, dependencies met |
| `status:in-progress` | Claimed and actively being worked |
| `status:blocked` | Cannot proceed — see blocking label |
| `status:review` | PR open, waiting for QA review |
| `status:done` | Merged and closed |

### Priority labels
`priority:p0` (ship first) · `priority:p1` · `priority:p2` (nice to have)

### Size labels
`size:s` (≤4h) · `size:m` (1 day) · `size:l` (2+ days)

### Qualifier labels
| Label | Meaning |
|---|---|
| `parallel-safe` | Can run simultaneously with any other issue |
| `needs-contract` | Produces a schema/API contract others depend on |
| `blocked-by-schema` | Needs a schema migration to complete first |
| `blocked-by-api` | Needs an API contract to be finalised first |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "≥3 issues already in-progress" | Wait for current agents to finish, or close stale in-progress issues on GitHub |
| Agent picks the wrong issue | Check the issue has the correct `area:` label |
| Frontend blocked | Correct — close the `needs-contract` issue first, then re-run `/sprint` |
| No issues found | Verify issues have `status:ready` label and no assignee |
| Pull blocked by uncommitted changes | Commit or stash your local work, then re-run `/sprint` |
| Agent team feature not working | Confirm `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` is exported in your shell |
