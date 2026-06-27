# OKF — Operational Knowledge File Index

**Purpose:** OKF stores durable agent knowledge: workflows, ranking rubrics, cultural guardrails, and safety rules. AI services read these files at prompt-build time to ground their outputs in consistent policy.

**OKF must NEVER contain:**
- Contact names, emails, phone numbers, LinkedIn URLs
- User profile data
- Uploaded business card images or scanned content
- Agent run logs or tool call logs
- Audit logs
- Any inferred sensitive traits (religion, ethnicity, politics)

---

## Contents

### Workflows
Describes the step-by-step process for each core feature.

| File | Description |
|------|-------------|
| `workflows/contact-capture.md` | How contacts enter the system (manual, VCF, OCR) |
| `workflows/briefing-generation.md` | How contact briefings are generated |
| `workflows/top-5-ranking.md` | How contacts are ranked for a goal |
| `workflows/follow-up-generation.md` | How follow-up drafts are generated |

### Concepts
Defines the rubrics and models used in AI outputs.

| File | Description |
|------|-------------|
| `concepts/opportunity-scoring.md` | The 9-dimension scoring model |
| `concepts/cultural-awareness.md` | How to handle language and cultural context |
| `concepts/confidence-scoring.md` | How confidence scores are calculated |
| `concepts/evidence-grounding.md` | How evidence is collected and weighted |

### Safety
Defines what is allowed, what is forbidden, and how to handle edge cases.

| File | Description |
|------|-------------|
| `safety/privacy-and-consent.md` | User data rights and privacy rules |
| `safety/prompt-injection.md` | Injection risks and mitigations |
| `safety/anti-stereotyping.md` | Cultural guardrails and stereotyping prevention |

---

## How AI Services Use OKF

Services load relevant OKF files into their system prompt context:

```ts
// Example: briefing.service.ts
const culturalAwareness = readOkfFile("concepts/cultural-awareness.md")
const antiStereotyping = readOkfFile("safety/anti-stereotyping.md")
const systemPrompt = buildSystemPrompt({ culturalAwareness, antiStereotyping })
```

Services should load the minimum necessary files — not the entire OKF bundle.
