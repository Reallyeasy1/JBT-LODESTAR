# Lodestar

Mobile-first networking intelligence for turning event contacts into ranked next actions.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm build
```

The current slice is a frontend MVP backed by typed demo data and local interactions. It covers the phone-first event dashboard, contact capture, prioritisation, briefing, localisation, and follow-up review flows. Backend, authentication, persistence, OCR, and model integrations are intentionally left behind clear UI boundaries for the next implementation phase.
