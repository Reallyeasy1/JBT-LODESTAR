# GitHub CLI Commands

**Owner:** lodestar-orchestrator
**Last updated:** 2026-06-27

Run these commands to set up labels and create issues on GitHub.
Replace `REPO` with `Reallyeasy1/JBT-LODESTAR` or run from the cloned repo directory.

---

## Step 1: Create Labels

```bash
# Status labels
gh label create "status:ready"       --color "0075ca" --description "Available to claim"
gh label create "status:in-progress" --color "e4e669" --description "Being worked on"
gh label create "status:blocked"     --color "d93f0b" --description "Cannot proceed"
gh label create "status:review"      --color "a2eeef" --description "PR open, awaiting review"
gh label create "status:done"        --color "0e8a16" --description "Merged and closed"

# Area labels
gh label create "area:frontend"  --color "fbca04" --description "Next.js pages, components, routes"
gh label create "area:backend"   --color "fbca04" --description "Service functions, utils"
gh label create "area:data"      --color "fbca04" --description "Prisma schema, migrations, seed"
gh label create "area:ai"        --color "fbca04" --description "AI services, prompts, Zod schemas"
gh label create "area:safety"    --color "e11d48" --description "Privacy, security, guardrails"
gh label create "area:qa"        --color "e11d48" --description "Quality assurance"
gh label create "area:okf"       --color "8b5cf6" --description "OKF knowledge bundle"
gh label create "area:docs"      --color "8b5cf6" --description "Planning docs, CLAUDE.md"
gh label create "area:devops"    --color "8b5cf6" --description "CI/CD, deployment"

# Agent labels
gh label create "agent:product-architect"      --color "c0a000" --description "product-architect agent"
gh label create "agent:fullstack-builder"      --color "c0a000" --description "fullstack-builder agent"
gh label create "agent:data-backend-engineer"  --color "c0a000" --description "data-backend-engineer agent"
gh label create "agent:ai-workflow-engineer"   --color "c0a000" --description "ai-workflow-engineer agent"
gh label create "agent:safety-qa-engineer"     --color "c0a000" --description "safety-qa-engineer agent"

# Priority labels
gh label create "priority:p0" --color "b60205" --description "Must ship for demo"
gh label create "priority:p1" --color "e4e669" --description "Important, after p0"
gh label create "priority:p2" --color "c5def5" --description "Nice to have"

# Size labels
gh label create "size:s" --color "c5def5" --description "~4 hours"
gh label create "size:m" --color "c5def5" --description "~1 day"
gh label create "size:l" --color "c5def5" --description "2+ days"

# Qualifier labels
gh label create "parallel-safe"      --color "0e8a16" --description "No file conflicts with other active issues"
gh label create "needs-contract"     --color "f9d0c4" --description "Produces schema or API contract others depend on"
gh label create "blocked-by-schema"  --color "d93f0b" --description "Needs Prisma migration first"
gh label create "blocked-by-api"     --color "d93f0b" --description "Needs API contract first"
gh label create "blocked-by-design"  --color "d93f0b" --description "Needs product decision first"
```

---

## Step 2: Create Issues

```bash
# Issue 1
gh issue create \
  --title "Define MVP product scope and demo script" \
  --body "See _workspace/issue_backlog.md Issue #1 for full spec." \
  --label "area:docs,agent:product-architect,priority:p0,size:s,parallel-safe,status:ready"

# Issue 2
gh issue create \
  --title "Create Prisma MySQL schema and seed data" \
  --body "See _workspace/issue_backlog.md Issue #2 for full spec." \
  --label "area:data,agent:data-backend-engineer,priority:p0,size:m,needs-contract,status:ready"

# Issue 3
gh issue create \
  --title "Build seeded demo event dashboard" \
  --body "See _workspace/issue_backlog.md Issue #3 for full spec." \
  --label "area:frontend,agent:fullstack-builder,priority:p0,size:m,blocked-by-schema,status:ready"

# Issue 4
gh issue create \
  --title "Implement deterministic contact ranking service" \
  --body "See _workspace/issue_backlog.md Issue #4 for full spec." \
  --label "area:ai,area:backend,agent:ai-workflow-engineer,priority:p0,size:m,blocked-by-schema,status:ready"

# Issue 5
gh issue create \
  --title "Build ranking results page" \
  --body "See _workspace/issue_backlog.md Issue #5 for full spec." \
  --label "area:frontend,agent:fullstack-builder,priority:p0,size:m,blocked-by-api,status:ready"

# Issue 6
gh issue create \
  --title "Implement contact briefing mock service" \
  --body "See _workspace/issue_backlog.md Issue #6 for full spec." \
  --label "area:ai,agent:ai-workflow-engineer,priority:p0,size:s,parallel-safe,status:ready"

# Issue 7
gh issue create \
  --title "Build contact detail and briefing page" \
  --body "See _workspace/issue_backlog.md Issue #7 for full spec." \
  --label "area:frontend,agent:fullstack-builder,priority:p0,size:m,blocked-by-api,status:ready"

# Issue 8
gh issue create \
  --title "Implement follow-up draft generation service" \
  --body "See _workspace/issue_backlog.md Issue #8 for full spec." \
  --label "area:ai,agent:ai-workflow-engineer,priority:p0,size:s,parallel-safe,status:ready"

# Issue 9
gh issue create \
  --title "Add OKF starter knowledge bundle" \
  --body "See _workspace/issue_backlog.md Issue #9 for full spec." \
  --label "area:okf,area:docs,agent:ai-workflow-engineer,priority:p1,size:s,parallel-safe,status:ready"

# Issue 10
gh issue create \
  --title "Add QA and safety checklist infrastructure" \
  --body "See _workspace/issue_backlog.md Issue #10 for full spec." \
  --label "area:qa,area:safety,agent:safety-qa-engineer,priority:p0,size:s,parallel-safe,status:ready"

# Issue 11
gh issue create \
  --title "Verify no LinkedIn scraping or automatic sending" \
  --body "See _workspace/issue_backlog.md Issue #11 for full spec." \
  --label "area:safety,agent:safety-qa-engineer,priority:p0,size:s,parallel-safe,status:ready"

# Issue 12
gh issue create \
  --title "Polish 30-second demo flow end-to-end" \
  --body "See _workspace/issue_backlog.md Issue #12 for full spec." \
  --label "area:frontend,area:docs,agent:product-architect,agent:fullstack-builder,priority:p1,size:m,status:ready"
```

---

## Verify

```bash
# List all issues
gh issue list --state open

# List ready issues
gh issue list --label "status:ready" --state open

# List all labels
gh label list
```
