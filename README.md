# Lodestar

Lodestar is an AI-powered networking operating system for conferences and professional events.

## AI Provider Configuration

AI calls run through `src/ai/client.ts` and are selected by environment variable:

```env
AI_PROVIDER="mock"      # default, deterministic mock output
OPENAI_MODEL="gpt-4o-mini"
OPENAI_API_KEY="sk-..."
```

### Modes

- `AI_PROVIDER=mock`: no API key required; used for local deterministic demos/tests.
- `AI_PROVIDER=vercel`: uses Vercel AI SDK + OpenAI provider and requires `OPENAI_API_KEY`.

`AI_PROVIDER=openai` is accepted as an alias for `vercel` for backwards compatibility.
