---
name: lodestar-product-planning
description: Playbook for product scoping, demo script maintenance, issue refinement, and sprint prioritization.
---

# Lodestar Product Planning Playbook

Use for scope decisions, demo script maintenance, issue refinement, and prioritization.

## Scope Filter

Ask:

1. Does this directly support the demo vertical slice?
2. Does it require forbidden technology?
3. Can it wait until the core flow works?

If it does not support the core slice, defer or cut it.

## Demo Script

```txt
Open /events/[eventId]
-> See Sup Build2026 Hackathon and goal
-> Click Rank Top Contacts
-> See top 5 with score, type, reasoning, next action
-> Open top contact
-> See briefing, talking points, questions
-> Generate intro
-> Add meeting note
-> Draft follow-up
```

## Issue Quality

Every issue should include:

- Goal
- Context
- Scope
- Files likely touched
- Binary acceptance criteria
- Test plan
- Dependencies
- Labels
- Suggested role
