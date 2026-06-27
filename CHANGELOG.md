# Changelog

All notable changes to Lodestar are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
**Maintained by the orchestrator post-merge — PR authors supply the entry via the `## Changelog Entry` field in their PR body. See `lodestar-github-workflow` skill §4.**

---

## [Unreleased]

### Added
- Prisma MySQL schema: 14 models (User, Event, Contact, Briefing, Ranking, RankingItem, FollowUp, Localisation, AgentRun, ToolCall, AuditLog, Feedback, Interaction, ContactImport) with cascade deletes and composite indexes ([#2](../../pull/17))
- Demo seed data: Alex Tan, Sup Build2026 Hackathon, 6 contacts including intentional Sarah Tan / Sarah T. duplicate pair for identity resolution demo ([#2](../../pull/17))
- Identity resolution service: three-tier confidence matching — exact email/phone/LinkedIn (0.99), normalised name+company (0.95), partial name+company (0.65) ([#2](../../pull/17))
- AgentRun service: `startAgentRun` / `completeAgentRun` for logging every AI call ([#2](../../pull/17))
- Next.js 15 App Router scaffold with Tailwind CSS v3, TypeScript, mock auth (`getCurrentUser`) ([#2](../../pull/17))
- OKF knowledge bundle: ranking rubric, cultural guardrails, safety rules, evidence-grounding policy ([#9](../../pull/14))
- QA safety checklist: structured review gate covering privacy, prompt injection, stereotyping, contract mismatches ([#10](../../pull/15))
- Six-agent harness: orchestrator + product-architect, data-backend-engineer, ai-workflow-engineer, fullstack-builder, safety-qa-engineer agent definitions
- `/sprint` command: routes GitHub Issues to specialist agents following dependency order
- `lodestar-sprint-planning` skill: guided sprint planning with upfront Q&A before issue selection
- `lodestar-github-workflow` skill: parallel-safe claim → branch → PR → review → merge protocol
- `docs/workflow-setup.md`: full harness setup and onboarding guide

### Changed
- `/sprint` Step 0: always syncs `origin/main` before context check to prevent stale branch bases
- MVP scope: onboarding, dashboard, event creation, manual contact entry deferred; demo is seed-data-driven

---

<!-- When a version is released, move [Unreleased] items here:
## [0.1.0] - YYYY-MM-DD
-->
