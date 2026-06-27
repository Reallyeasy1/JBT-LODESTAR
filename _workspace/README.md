# _workspace — Lodestar Planning Artifacts

This directory contains orchestrator-maintained planning documents for the Lodestar Claude Code agent team.

**Do not store:**
- User contact data
- Private user profiles
- Business card images
- Agent run logs (those go in the MySQL `AgentRun` table)

**All files here are created and updated by `lodestar-orchestrator` only.**

## Files

| File | Owner | Purpose |
|------|-------|---------|
| `product_scope.md` | product-architect | MVP scope, demo script, cut list |
| `technical_plan.md` | data-backend-engineer + ai-workflow-engineer | Schema, service contracts, API shapes |
| `agent_handoff.md` | lodestar-orchestrator | Phase status, completed work, next tasks |
| `github_workflow.md` | lodestar-orchestrator | Label taxonomy, issue workflow, commands |
| `issue_backlog.md` | product-architect + lodestar-orchestrator | GitHub issue drafts for first vertical slice |
| `qa_checklist.md` | safety-qa-engineer | Running safety/QA checks and findings |
| `github_commands.md` | lodestar-orchestrator | `gh` CLI commands to create labels and issues |

## How to Use

When starting a new session:
1. Read `agent_handoff.md` first to understand current state
2. Read `technical_plan.md` for current schema and service contracts
3. Check GitHub for `status:ready` issues before starting any work
