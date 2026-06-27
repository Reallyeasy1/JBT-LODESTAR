# Issue Writing Guide

Use this structure for each implementation issue.

## Title
[Verb] [specific thing]

## Goal
One sentence user outcome.

## Context
Why this exists and what it depends on.

## Scope
- Exactly what to build
- Explicit out-of-scope items

## Files Likely Touched
- `src/...`
- `prisma/...`

## Acceptance Criteria
- 5 to 8 binary checks

## Test Plan
- Manual verification steps
- API/validation checks

## Dependencies
- Issue numbers or `none`

## Labels
- `area:*`
- `agent:*`
- `priority:*`
- `size:*`
- `status:ready` (or workflow equivalent)

## Suggested Assignee
- [Role/agent]

## Shippability Rule
This issue must be independently shippable in one PR and must not require unfinished work from sibling issues.
