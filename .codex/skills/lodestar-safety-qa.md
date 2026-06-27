---
name: lodestar-safety-qa
description: Playbook for safety review, QA checks, type/lint verification, and acceptance criteria review.
---

# Lodestar Safety & QA Playbook

Use for PR review, safety review, type/lint verification, and acceptance criteria checks.

## Required Checks

```bash
npx tsc --noEmit
npm run lint
npx prisma validate
```

## Review Comment Shape

```txt
## QA Review - Issue #N

### Build
- [ ] tsc --noEmit exits 0
- [ ] npm run lint exits 0
- [ ] prisma validate exits 0

### BLOCKERs
- [ ] ...

### WARNINGs
- [ ] ...

### SUGGESTIONs
- [ ] ...

### Acceptance Criteria Verification
- [ ] AC1

Verdict: BLOCKED / PASS
```

## Blockers

- Automatic external sending
- Cultural identity inference
- Unsanitized prompt construction
- Private data in OKF
- AI output saved before Zod validation
- Missing follow-up user review
- Contract mismatches
- Private data exposed without auth
