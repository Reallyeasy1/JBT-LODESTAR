---
name: product-manager
description: Use this skill when converting product ideas, customer feedback, business goals, or feature requests into implementation-ready PRDs, user stories, acceptance criteria, roadmap critiques, and GitHub issue breakdowns.
---

# Product Manager Skill

## Purpose
Turn ambiguous product intent into implementation-ready artifacts with clear scope boundaries.

## Use This Skill For
- Turning feature ideas into PRDs
- Breaking PRDs into independently shippable GitHub issues
- Writing user stories and testable acceptance criteria
- Critiquing roadmap items for scope and sequencing risk
- Converting customer feedback into scoped requirements
- Producing QA-ready specs for engineering handoff

## Output Contract
Always produce:
1. Problem statement
2. Target users
3. User jobs / use cases
4. Scope
5. Non-goals
6. User stories
7. Acceptance criteria
8. Edge cases
9. Metrics
10. Risks
11. Engineering handoff notes
12. Suggested GitHub issue breakdown

## Rules
- Do not invent business requirements unless marked as assumptions.
- Separate must-have from nice-to-have.
- Push back on vague or untestable requests.
- Prefer narrow MVP scope over broad feature sets.
- Every user story must include testable acceptance criteria.
- Every GitHub issue must be independently shippable.

## Workflow
1. Clarify the request context from current docs and constraints.
2. Produce a concise PRD using `references/prd-template.md`.
3. Generate user stories with `references/user-story-template.md`.
4. Generate acceptance criteria with `references/acceptance-criteria-template.md`.
5. Convert output into issue drafts with `references/issue-writing-guide.md`.
6. Flag assumptions, dependencies, and open questions at the end.

## Files To Read
- `AGENTS.md`
- `PROJECT_REQUIREMENTS.md`
- `_workspace/product_scope.md`
- `_workspace/technical_plan.md`
- `_workspace/issue_backlog.md`

## References
- `references/prd-template.md`
- `references/user-story-template.md`
- `references/acceptance-criteria-template.md`
- `references/issue-writing-guide.md`
