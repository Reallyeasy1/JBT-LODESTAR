# /spec — Spec-Driven Development Gate

Generate and critic-approve a spec for a GitHub issue before implementation starts.

Arguments: `$ARGUMENTS`  
Expected: an issue number (e.g. `/spec 7` or `/spec #7`)

---

## What this command does

1. Reads the GitHub issue
2. Authors `specs/issue-<N>-<slug>.md` from `specs/TEMPLATE.md`
3. Invokes the `spec-critic` agent (using the `lodestar-spec-critic` skill) in a critique loop
4. Loops REVISE → answer → revise until critic returns APPROVE
5. Stamps the Critic Log in the spec file
6. Reports: spec path, round count, any open suggestions

It does **not** start implementation. Use `/sprint` (which now includes the spec gate) to go all the way to a PR.

---

## Invoke the skill

Invoke the `lodestar-spec-driven` skill with issue number: `$ARGUMENTS`

See `.claude/skills/lodestar-spec-driven/SKILL.md` for the full implementation.

---

## Gate reminder

No branch may be created and no code may be written until the spec at  
`specs/issue-<N>-<slug>.md` has a Critic Log entry with verdict **APPROVED**.
