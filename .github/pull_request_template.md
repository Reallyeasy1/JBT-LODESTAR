## Summary

<!-- What was built and why. 1-3 sentences. -->

Closes #<!-- issue number -->

## Changelog Entry

<!-- One line for CHANGELOG.md [Unreleased]. Category = Added | Changed | Fixed | Removed.
     Format: `- Category: short description (#issue)`. Write "none" for chore/docs-only PRs.
     The orchestrator transcribes this into CHANGELOG.md after merge — do NOT edit CHANGELOG.md on your branch. -->
- Added:

## Files Changed

<!-- List each file and what changed -->
- `src/...`:

## Test Plan

<!-- Steps to manually verify acceptance criteria -->
- [ ]
- [ ]

## Screenshots

<!-- Required for any UI change. Mobile (375px) and desktop. -->

## Safety Checklist

<!-- Check all that apply to this PR -->
- [ ] No code path sends email/message without explicit user action
- [ ] No cultural identity inferred from name/nationality/company
- [ ] No unsanitised user input in prompts
- [ ] No `okf/` file contains contact data
- [ ] All AI outputs pass Zod validation before DB write
- [ ] `requiresUserReview: true` on all follow-up outputs (if applicable)
- [ ] No LinkedIn scraping or LinkedIn API calls

## Risks and Follow-Up

<!-- Known edge cases, tech debt, or follow-up issues needed -->
