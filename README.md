# BriefMe — Paste the mess, get the brief

**BriefMe turns long documents into one-page, decision-ready briefs.** Paste a
meeting transcript, a research article, or a tangled email thread, and get
back a TL;DR, the key points, the decisions that were actually made, the
action items with owners and due dates, and the questions still open — plus a
one-click copy of the whole brief as Markdown.

Built for the Devpost **Build With AI: Basics** hackathon, planned and built
with the Devpost Learn Skill Pack (see the `devpost/` folder for the planning
documents the process produced).

## The problem

Knowledge work runs on documents, and documents are where decisions go to
hide. A 45-minute sync produces four pages of transcript; the three decisions
and five action items inside it are what everyone actually needs, and nobody
has time to dig them out. So action items get missed, decisions get
re-litigated, and the same meeting happens again next week.

## The solution

BriefMe does one thing end to end: one document in, one structured brief out.

- **TL;DR** — the document in two or three sentences.
- **Key points** — the facts and arguments that matter.
- **Decisions** — what was actually agreed (empty if nothing was).
- **Action items** — task, owner, and due date, in a clean table.
- **Open questions** — what the document leaves unresolved.
- **Copy as Markdown** — the brief drops straight into notes, email, or a wiki.

Three seeded sample documents (a product sync, a research digest, a support
thread) are built in, so the full flow works the moment the app starts.

## How it works

1. The browser posts the document to `POST /api/brief`.
2. The Express server calls the **Google Gemini API** with a strict system
   instruction ("extract only what the document states; never invent owners
   or dates") and a **JSON response schema**, so the model returns data, not
   prose to scrape.
3. The server validates and normalises the JSON, then the UI renders it as
   brief cards.
4. **No API key? No problem.** Without `GEMINI_API_KEY`, BriefMe runs a
   clearly labelled **offline demo mode**: a deterministic local extractor
   (sentence ranking + commitment/decision/question pattern matching) that
   produces the same brief shape. It never pretends to be the AI — the UI
   badge and the brief both say "demo". The same fallback covers Gemini
   outages and rate limits, so the demo never breaks.

## Tech stack

- **Node.js + Express 4 + TypeScript** (compiled with `tsc`, strict mode)
- **Google Gemini API** over plain HTTPS `fetch` — no SDK dependency
  (default model `gemini-2.5-flash`, free tier)
- **Dependency-free frontend**: HTML, CSS, and vanilla JS in `public/`
- No database, no accounts, no paid services

## Run it

```bash
npm install

# Optional but recommended: enable real AI briefs.
# Get a free key at https://aistudio.google.com — no card required.
cp .env.example .env
# then paste your key after GEMINI_API_KEY=

npm run build
npm start
```

Open **http://localhost:3000**, load a sample, and hit **Generate brief**.

Development mode (auto-reload): `npm run dev`

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `GEMINI_API_KEY` | (none) | Free Gemini key; absence = offline demo mode |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model name |
| `PORT` | `3000` | Listen port |

Documents must be between 200 and 60,000 characters. Nothing is stored;
documents are processed per request and forgotten.

## Project structure

```
devpost/          Planning docs from the Skill Pack process (scope, PRD, spec, checklist)
public/           Single-page UI (index.html, styles.css, app.js)
src/
  server.ts       Express app: routes, validation, mode selection, fallbacks
  gemini.ts       Gemini call with JSON schema, repair retry, error taxonomy
  demoBrief.ts    Offline deterministic extractor (demo mode)
  samples.ts      Three seeded sample documents
  types.ts        The brief schema shared by server and docs
```

## What I learned

- **Structured output changes everything.** Asking Gemini for a JSON schema
  instead of "a summary, please" turned a fuzzy prompt into a contract the
  server can validate — and made the UI trivial to build against.
- **Plan before code is not ceremony.** Writing the scope, PRD, and spec
  first (the Skill Pack's whole point) surfaced the two hardest decisions —
  the brief schema and the no-key fallback — before they could become
  rework.
- **Design for the demo failing.** The offline extractor started as a
  fallback and became a feature: the app can be judged anywhere, key or no
  key, network or no network.

## What's next

- File uploads (PDF/Word) and brief history
- "Brief my week": batch-brief a folder of meeting notes
- Shareable brief links and team workspaces

## License

MIT — see [LICENSE](LICENSE).
