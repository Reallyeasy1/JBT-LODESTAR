# Lodestar Claude Code Workflow — Setup Guide

Complete setup guide for the Lodestar multi-agent development workflow. After following this guide you will have a fully wired Claude Code team that can autonomously pick up GitHub Issues, implement them in parallel, and hand off to QA — all from a single `/sprint` command.

---

## Table of Contents

1. [System Prerequisites](#1-system-prerequisites)
2. [Required Tools](#2-required-tools)
3. [Claude Code Installation](#3-claude-code-installation)
4. [Required Plugins](#4-required-plugins)
5. [Project Setup](#5-project-setup)
6. [Environment Variables](#6-environment-variables)
7. [GitHub Setup](#7-github-setup)
8. [Agent Team Configuration](#8-agent-team-configuration)
9. [Verify the Setup](#9-verify-the-setup)
10. [Running Your First Sprint](#10-running-your-first-sprint)
11. [The Agent Team](#11-the-agent-team)
12. [GitHub Issue Label System](#12-github-issue-label-system)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. System Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20+ | Required for Next.js and npm |
| npm | 10+ | Comes with Node.js |
| Git | 2.x+ | Must be on PATH |
| MySQL | 8.0+ | Local or remote instance |
| Windows / macOS / Linux | — | Claude Code runs on all three |

---

## 2. Required Tools

### GitHub CLI (`gh`)
The workflow uses `gh` to claim issues, post comments, and open PRs — all from inside agents.

```bash
# macOS
brew install gh

# Windows (winget)
winget install --id GitHub.cli

# Linux
sudo apt install gh   # or see https://cli.github.com
```

Authenticate after installing:
```bash
gh auth login
gh auth status   # verify
```

### Node.js
```bash
# Download from https://nodejs.org (LTS)
node -v   # should be 20+
npm -v    # should be 10+
```

---

## 3. Claude Code Installation

```bash
npm install -g @anthropic-ai/claude-code
claude --version   # verify
```

Log in:
```bash
claude
# follow the OAuth prompt on first run
```

> Claude Code is the CLI that powers all agent work. Every `/sprint` run, every subagent, and every skill invocation runs through it.

---

## 4. Required Plugins

Plugins extend Claude Code with skills, agents, and hooks. Install them via the Claude Code plugin registry.

### 4.1 Superpowers (required)
Provides the core skill system — the mechanism that loads `.claude/skills/` files and makes `/sprint` and all specialist skills available.

```
/install superpowers
```

Or install from Claude Code settings → Plugins → search "superpowers".

**Why it's needed:** Every lodestar skill (`lodestar-orchestrate`, `lodestar-data-backend`, `lodestar-fullstack-build`, etc.) is loaded through the superpowers skill system. Without it, `/sprint` cannot invoke agent skills.

### 4.2 Ponytail (recommended)
Enforces lazy, minimal code generation — no speculative abstractions, no over-engineering. Prevents agents from building more than the issue requires.

```
/install ponytail
```

**Why it's needed:** When running 3 agents in parallel, each independently tends to over-build. Ponytail keeps every agent scoped to the minimum working implementation.

### 4.3 Claude-mem (recommended)
Persistent memory system that carries context across sessions — what was built last sprint, what's blocked, what decisions were made.

```
/install claude-mem
```

**Why it's needed:** `/sprint` reads `_workspace/agent_handoff.md` to know what was done last session. Claude-mem's observation system keeps the broader project history searchable across sessions.

### 4.4 PR Review Toolkit (recommended)
Provides the `safety-qa-engineer` agent's review checklist tooling — type analysis, silent failure hunting, comment accuracy checks.

```
/install pr-review-toolkit
```

**Why it's needed:** The `safety-qa-engineer` agent uses pr-review-toolkit skills for structured PR review passes before any issue moves to `status:done`.

### Verify plugins are installed
```
/plugins list
```
You should see: `superpowers`, `ponytail`, `claude-mem`, `pr-review-toolkit`.

---

## 5. Project Setup

### Clone the repository
```bash
git clone https://github.com/Reallyeasy1/JBT-LODESTAR.git
cd JBT-LODESTAR
```

### Install dependencies
```bash
npm install
```

> **Note:** The Next.js scaffold and Prisma client are generated during Issue #2. If `node_modules/` is empty and `src/` doesn't exist yet, that's expected — run `/sprint #2` to bootstrap them.

### Verify project structure
After initial scaffold, you should have:
```
.
├── .claude/
│   ├── agents/          ← agent role definitions
│   ├── commands/        ← /sprint slash command
│   ├── settings.json    ← permission allowlist
│   └── skills/          ← lodestar skill files
├── .agents/             ← agent skills (alternative path)
├── .codex/              ← Codex equivalent of .claude/
├── _workspace/          ← planning docs, handoff, QA checklist
├── docs/                ← this guide and other docs
├── okf/                 ← AI knowledge bundle (no user data)
├── prisma/              ← schema, migrations, seed
├── src/                 ← Next.js app source
├── AGENTS.md            ← Codex project instructions
├── CLAUDE.md            ← Claude Code project instructions
└── PROJECT_REQUIREMENTS.md
```

---

## 6. Environment Variables

Create a `.env` file in the project root:

```bash
# .env

# MySQL connection string
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/lodestar"

# Optional — only needed when using a real LLM provider
# Leave unset for mock AI (works for demo without any API key)
ANTHROPIC_API_KEY=""

# Next.js
NEXTAUTH_SECRET="your-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

> **Mock AI mode:** The stack is designed to run without a real LLM. `src/ai/client.ts` returns structured mock data unless `ANTHROPIC_API_KEY` is set. The demo vertical slice works fully in mock mode.

### Create the MySQL database
```sql
CREATE DATABASE lodestar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 7. GitHub Setup

### Authentication
```bash
gh auth login --scopes "repo,read:org"
gh auth status   # confirm token has repo scope
```

### Create the required labels
The workflow depends on a specific label set. Run this once to create all labels in your repo:

```bash
# Status labels
gh label create "status:ready"       --color "0075ca" --description "Available to claim"
gh label create "status:in-progress" --color "e4e669" --description "Being worked on"
gh label create "status:blocked"     --color "d93f0b" --description "Cannot proceed"
gh label create "status:review"      --color "0075ca" --description "PR open, awaiting QA"
gh label create "status:done"        --color "0e8a16" --description "Merged and closed"

# Area labels
gh label create "area:data"     --color "fbca04" --description "Prisma schema, migrations, seed"
gh label create "area:ai"       --color "fbca04" --description "AI services, prompts, Zod schemas"
gh label create "area:backend"  --color "fbca04" --description "Service functions, utils"
gh label create "area:frontend" --color "fbca04" --description "Next.js pages, components, routes"
gh label create "area:safety"   --color "e11d48" --description "Privacy, security, guardrails"
gh label create "area:qa"       --color "e11d48" --description "Quality assurance"
gh label create "area:okf"      --color "8b5cf6" --description "OKF knowledge bundle"
gh label create "area:docs"     --color "8b5cf6" --description "Planning docs, CLAUDE.md"

# Agent labels
gh label create "agent:product-architect"     --color "c0a000" --description "product-architect agent"
gh label create "agent:data-backend-engineer" --color "c0a000" --description "data-backend-engineer agent"
gh label create "agent:ai-workflow-engineer"  --color "c0a000" --description "ai-workflow-engineer agent"
gh label create "agent:fullstack-builder"     --color "c0a000" --description "fullstack-builder agent"
gh label create "agent:safety-qa-engineer"    --color "c0a000" --description "safety-qa-engineer agent"

# Priority labels
gh label create "priority:p0" --color "b60205" --description "Must ship for demo"
gh label create "priority:p1" --color "e4e669" --description "Important, after p0"
gh label create "priority:p2" --color "cfd3d7" --description "Nice to have"

# Size labels
gh label create "size:s" --color "c5def5" --description "~4 hours"
gh label create "size:m" --color "c5def5" --description "~1 day"
gh label create "size:l" --color "c5def5" --description "2+ days"

# Qualifier labels
gh label create "parallel-safe"      --color "0e8a16" --description "No file conflicts with other active issues"
gh label create "needs-contract"     --color "f9d0c4" --description "Produces schema or API contract others depend on"
gh label create "blocked-by-schema"  --color "d93f0b" --description "Needs Prisma migration first"
gh label create "blocked-by-api"     --color "d93f0b" --description "Needs API contract first"
gh label create "blocked-by-design"  --color "d93f0b" --description "Needs product/UX decision first"
```

---

## 8. Agent Team Configuration

### 8.1 Enable the agent teams feature
Add to your shell profile (`.bashrc`, `.zshrc`, or PowerShell `$PROFILE`):

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Then reload your shell:
```bash
source ~/.bashrc   # or source ~/.zshrc
```

This flag enables Claude Code to spawn multiple subagents in parallel from a single session.

### 8.2 Permissions allowlist
The project ships with `.claude/settings.json` pre-configured with the permissions needed for agents to work without prompting:

```json
{
  "permissions": {
    "allow": [
      "Bash(gh issue edit *)",
      "Bash(gh issue comment *)",
      "Bash(gh pr create *)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git pull *)",
      "Bash(git checkout *)",
      "Bash(git add *)",
      "Bash(npx prisma generate)",
      "Bash(npx prisma migrate dev *)",
      "Bash(npx prisma db push)",
      "Bash(npx prisma db seed)",
      "Bash(npx tsc --noEmit)",
      "Bash(npm run lint)",
      "Bash(npm install)",
      "Bash(npm install *)",
      "Bash(npx create-next-app *)"
    ]
  }
}
```

This file is committed — no manual setup needed. If you add new commands that agents need, run `/fewer-permission-prompts` to auto-expand the list from your session history.

### 8.3 Agent role files
Six agents are defined in `.claude/agents/`. Each one has a description, model, and role prompt. Claude Code auto-discovers these — no registration step needed.

| Agent | File | Scope |
|---|---|---|
| `lodestar-orchestrator` | `.claude/agents/lodestar-orchestrator.md` | Sprint planning, cross-agent coordination |
| `product-architect` | `.claude/agents/product-architect.md` | Product scope, demo story, issue refinement |
| `data-backend-engineer` | `.claude/agents/data-backend-engineer.md` | Prisma, MySQL, seed, identity resolution |
| `ai-workflow-engineer` | `.claude/agents/ai-workflow-engineer.md` | AI services, Zod schemas, OKF files |
| `fullstack-builder` | `.claude/agents/fullstack-builder.md` | Next.js pages, components, API routes |
| `safety-qa-engineer` | `.claude/agents/safety-qa-engineer.md` | Safety reviews, build checks, QA |

---

## 9. Verify the Setup

Run these checks in order:

```bash
# 1. GitHub CLI authenticated
gh auth status

# 2. Claude Code installed
claude --version

# 3. Agent teams flag set
echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS   # should print: 1

# 4. Database reachable (after .env is set)
npx prisma db push   # should exit 0

# 5. Labels exist in repo
gh label list --limit 50 | grep "status:ready"
```

Inside Claude Code, verify skills load:
```
/sprint p0
```
If the skill loads and reads the issue board, setup is complete.

---

## 10. Running Your First Sprint

Open Claude Code in the project directory:

```bash
cd /path/to/JBT-LODESTAR
claude
```

Then type:
```
/sprint
```

What happens step by step:

```
/sprint
  │
  ├── Step 0: git pull origin main           (sync local main with remote)
  ├── Step 1: reads _workspace/agent_handoff.md
  │           reads _workspace/technical_plan.md
  │           checks status:in-progress count (stops if ≥3)
  │           checks for needs-contract blockers
  │
  ├── Step 2: gh issue list --label status:ready
  │           applies dependency order: data → ai → frontend → safety
  │           selects up to 3 issues
  │
  ├── Step 3: routes each issue to the correct agent
  │
  ├── Step 4: for each issue:
  │             gh issue edit N --add-label status:in-progress
  │             gh issue comment N  (posts plan)
  │             launches agent in background
  │
  ├── Step 5: waits for all agents to complete
  │           collects PR links and blocker reports
  │
  └── Step 6: updates _workspace/agent_handoff.md
              reports: launched / in-review / blocked
```

### Filtered runs
```bash
/sprint p0           # only priority:p0 issues
/sprint #2 #9 #10   # exactly these issue numbers
/sprint frontend     # only area:frontend issues
/sprint data         # only area:data issues
```

### After each sprint
Run `/sprint` again. It reads the handoff doc and picks up the next batch automatically.

---

## 11. The Agent Team

### How agents are selected
Each GitHub Issue has `area:` and `agent:` labels. `/sprint` routes based on the first matching rule:

| Labels on issue | Agent dispatched |
|---|---|
| `area:data` or `needs-contract` | `data-backend-engineer` |
| `area:ai` or `area:backend` | `ai-workflow-engineer` |
| `area:frontend` | `fullstack-builder` |
| `area:okf` or `parallel-safe` | `ai-workflow-engineer` |
| `area:safety` or `area:qa` | `safety-qa-engineer` |
| `agent:product-architect` | `product-architect` |

### Dependency order
Enforced by `/sprint` — agents are not launched out of order:

```
Sprint 1  →  area:data       schema, migrations, seed (unblocks everything)
Sprint 2  →  area:ai         AI services, Zod schemas, OKF
Sprint 3  →  area:frontend   pages, components, API routes
Sprint 4  →  area:safety     safety review, QA sign-off
```

`area:frontend` issues are never started while any `needs-contract` issue remains open.

### Concurrency cap
Maximum **3 issues in-progress** at once. More than 3 causes file conflicts and API rate limit degradation without meaningful speed gain.

### What each agent owns

**data-backend-engineer**
- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`
- `src/lib/db.ts`, `src/lib/audit.ts`
- `src/services/identity-resolution.service.ts`
- `src/services/agent-run.service.ts`

**ai-workflow-engineer**
- `src/ai/client.ts`, `src/ai/prompts/`, `src/ai/schemas/`
- `src/services/briefing.service.ts`, `ranking.service.ts`, `followup.service.ts`
- `okf/` knowledge bundle files

**fullstack-builder**
- `src/app/` (pages and layouts)
- `src/components/`
- `src/app/api/` (route handlers)

**safety-qa-engineer**
- `_workspace/qa_checklist.md`
- PR reviews (all issues touching `src/ai/`, `src/services/`, `okf/`)
- Build, lint, and type check verification

**product-architect**
- `_workspace/product_scope.md`
- GitHub issue refinement and acceptance criteria
- Demo script

---

## 12. GitHub Issue Label System

Every issue must have at minimum one `status:` label and one `area:` label.

### Status flow
```
status:ready → status:in-progress → status:review → status:done
                     ↓
               status:blocked (if blocked mid-work)
```

### Required label combinations for /sprint to pick up an issue
- ✅ `status:ready` + `area:data` + no assignee → picked up
- ✅ `status:ready` + `area:frontend` + `parallel-safe` + no assignee → picked up
- ❌ `status:blocked` → never picked up
- ❌ `status:ready` + assignee already set → skipped

### Qualifier labels that affect scheduling
| Label | Effect |
|---|---|
| `parallel-safe` | Can run simultaneously with any other issue — preferred when filling slots |
| `needs-contract` | Produces a schema/API contract. Must complete before dependent issues start |
| `blocked-by-schema` | Waits until all `needs-contract` issues are `status:done` |
| `blocked-by-api` | Waits until the relevant API route/service contract is published |

---

## 13. Troubleshooting

### Agent team not launching parallel agents
```
Check: echo $CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS
Fix:   export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
       (add to shell profile so it persists)
```

### `/sprint` stops at "≥3 issues already in-progress"
```
Check: gh issue list --label "status:in-progress" --state open
Fix:   Wait for running agents to finish their PRs, or manually
       close stale in-progress issues on GitHub if agents crashed
```

### Agent blocked by permission classifier
```
Cause: A subagent tried to run a command not in the allowlist
Fix:   Run /fewer-permission-prompts in Claude Code to auto-add
       missing patterns to .claude/settings.json
       Then start a NEW Claude Code session (new session loads
       the updated settings.json cleanly)
```

### Pull blocked by uncommitted changes
```
Fix:   Commit or stash local work before running /sprint
       git stash && /sprint    (then git stash pop after)
```

### Frontend issues not being picked up despite status:ready
```
Cause: A needs-contract issue is still open
Check: gh issue list --label "needs-contract" --state open
Fix:   Complete the blocking data/schema issue first
```

### `npx prisma generate` fails
```
Check: DATABASE_URL is set correctly in .env
       mysql connection is reachable
Fix:   npx prisma db push  (syncs schema without migration file)
       npx prisma generate  (regenerates client)
```

### Agents open PRs against wrong base
```
Cause: Agent branched from stale local main
Fix:   /sprint now pulls main as Step 0, so this should not
       occur. If it does, manually: git fetch origin && git
       rebase origin/main on the affected branch
```

### Skills not loading (`/sprint` command not found)
```
Check: superpowers plugin is installed (/plugins list)
Fix:   /install superpowers
       Restart Claude Code
```
