# Safety: Privacy and Consent

## Core Principle
The user owns their contact data. Lodestar is a tool to help them manage and act on relationships — not a data broker, enrichment service, or surveillance system.

## Data Ownership Rules

1. **User owns all contacts they create.** Contacts are scoped to `userId` and never shared between users.

2. **Contacts are not enriched from external sources without user action.** Lodestar does not automatically fetch data about contacts from LinkedIn, social media, or data broker APIs.

3. **AI outputs are drafts, not facts.** Briefings, rankings, and follow-ups are AI-generated suggestions. They must be editable by the user and clearly labelled as AI-generated.

4. **Users can delete their data.** The `onDelete: Cascade` pattern on User relations ensures all user data is removed when a user account is deleted.

## What Lodestar Does NOT Store

- Inferred sensitive attributes: religion, ethnicity, politics, sexual orientation, health
- Scraped social media data
- Data the user did not explicitly enter or import
- Business card images after processing (in MVP — local only)

## OKF Isolation

The OKF knowledge bundle (`okf/`) is agent policy and rubric knowledge. It must never contain:
- Individual contact records
- User profile data
- Business card scans or OCR output
- Agent run inputs or outputs
- Any personally identifiable information (PII)

OKF is read by AI services to understand *how* to generate outputs, not *what* to say about specific people.

## Audit Logging

All mutations to user data are recorded in `AuditLog`:
- `entityType`: which model was changed
- `entityId`: which record
- `action`: what happened
- `oldValue` / `newValue`: what changed

This enables users (and eventually admins) to see what changed and when.

## API Authentication

Every API route that reads or writes user data must call `getCurrentUser()` and verify the returned user owns the resource being accessed. No route may return another user's contacts, events, or briefings.

## Retention

For MVP: data is retained until the user deletes it. No automatic expiry. Post-MVP: add configurable retention windows for old events and contacts.
