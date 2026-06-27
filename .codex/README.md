# Codex Harness

This directory mirrors the Claude Code harness in `.claude/` for Codex-oriented work.

- Root project instructions: `../AGENTS.md`
- Sprint command playbook: `commands/sprint.md`
- Specialist role playbooks: `agents/*.md`
- Reusable workflow playbooks: `skills/*.md`

Codex should treat `AGENTS.md` as the canonical project instruction file, then read the relevant `.codex/agents/` or `.codex/skills/` file for the current task.

## Session Rule

Read `_workspace/agent_handoff.md` first, then `_workspace/technical_plan.md` when touching schema, services, APIs, or UI.
