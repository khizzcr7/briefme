---
status: approved
project: BriefMe
depends_on: prd.md
---

# Technical Spec — BriefMe

## Stack

- **Runtime:** Node.js 20+ (developed on Node 24).
- **Server:** Express 4, written in TypeScript, compiled with `tsc` to
  `dist/`. Dev loop via `tsx watch`.
- **Frontend:** dependency-free HTML/CSS/vanilla JS in `public/`, served by
  Express as static files. No build step for the client.
- **AI:** Google Gemini API over plain HTTPS (`fetch`) — no SDK dependency.
  Default model `gemini-2.5-flash`, overridable with `GEMINI_MODEL`.
  Free tier only; the key comes from `GEMINI_API_KEY` in `.env`.

## API surface

| Route | Purpose |
| --- | --- |
| `GET /api/health` | `{ ok: true, mode: "gemini" \| "demo" }` |
| `GET /api/samples` | Seeded sample documents (id, title, docType, text) |
| `POST /api/brief` | `{ title?, docType, text }` → brief JSON (see schema) |

## Brief schema (the contract between server and UI)

```json
{
  "title": "string",
  "tldr": "string",
  "keyPoints": ["string"],
  "decisions": ["string"],
  "actionItems": [{ "task": "string", "owner": "string|null", "due": "string|null" }],
  "openQuestions": ["string"],
  "mode": "gemini | demo",
  "readingTimeSavedMinutes": 0
}
```

## Gemini call design

- Single `generateContent` request with `responseMimeType: application/json`
  and a `responseSchema` matching the brief schema, so the model returns
  data, not prose to scrape.
- System instruction pins the behaviour: extract only what the document
  states, never invent owners or dates, use `null` when unstated, keep the
  TL;DR under 60 words.
- Server validates and normalises the JSON before returning it; one retry
  with a repair prompt on malformed output, then a labelled demo-mode
  fallback.

## Demo mode (no key)

Deterministic local extraction from the same code path shape:

- TL;DR: top-ranked sentences by term frequency.
- Key points: next-ranked distinct sentences.
- Action items: lines matching commitment patterns ("X will …", "X to …",
  "by Friday", deadlines) with owner/due pulled from the line.
- Decisions: lines matching "decided/agreed/confirmed" patterns.
- Open questions: lines ending in "?" or flagged "TBD/open".

The response and the UI badge both say `demo`, plainly. It exists so the
proof of concept runs anywhere; it never pretends to be the AI.

## Config

| Variable | Default | Meaning |
| --- | --- | --- |
| `GEMINI_API_KEY` | (none) | Free key from Google AI Studio; absence = demo mode |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model name |
| `PORT` | `3000` | Listen port |

## Verification plan

- `npm run build` clean under `tsc --strict`.
- Smoke tests with curl: health, samples, brief in demo mode (shape matches
  schema), brief validation errors (too short / too long).
- Manual pass through the UI: all three samples, error states, copy button.
