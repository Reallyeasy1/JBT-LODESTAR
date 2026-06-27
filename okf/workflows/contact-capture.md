# Workflow: Contact Capture

## Purpose
Define how contacts enter the Lodestar system, what data is captured, and what happens after capture.

## Entry Points (MVP)

### Manual Entry
User types contact details directly into the app.
Fields: fullName, title, company, email, phone, linkedinUrl, websiteUrl, notes.
`sourceType: "manual"`, `sourceConfidence: 1.0`

### VCF Import (Phase 2)
User uploads a `.vcf` file. System parses with `src/tools/vcf-parser.ts`.
`sourceType: "vcf"`, `sourceConfidence: 0.9`

### OCR / Business Card (Phase 2)
User uploads a business card image. System extracts text with `src/tools/ocr.ts`.
`sourceType: "ocr"`, `sourceConfidence: 0.7` (varies by card quality)

### Screenshot / Profile Text (Phase 2)
User pastes LinkedIn profile text or screenshot.
`sourceType: "screenshot"`, `sourceConfidence: 0.6`

## Workflow Steps

1. **Receive input** → `contact-capture.service.ts` normalises and structures the raw input
2. **Identity resolution** → `identity-resolution.service.ts` checks for duplicates
   - `duplicate`: merge prompt shown to user
   - `possible-duplicate`: flagged for user review
   - `new`: proceed to save
3. **Save to database** → `Contact` record created via Prisma
4. **Log to ContactImport** → `ContactImport` record created with `status: "complete"` or `status: "error"`
5. **Queue briefing** → user can trigger briefing generation after saving

## Data Quality Rules

- If a field cannot be extracted with reasonable confidence, leave it null
- Never infer fields not present in the source data
- `sourceConfidence` reflects parsing quality, not the person's importance
- Always save the raw `sourcePayload` in `ContactImport.sourcePayload` for debugging

## What NOT To Do

- Do not scrape LinkedIn, Twitter, or any external URL
- Do not auto-enrich from external APIs without explicit user action
- Do not merge duplicates without user confirmation
- Do not save inferred personality traits, cultural identity, or sensitive attributes
