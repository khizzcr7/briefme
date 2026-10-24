# Devpost submission draft — BriefMe
# Hackathon: Build With AI: Basics (learn-ai-basics.devpost.com)
# Deadline: Monday, October 26, 2026, 5:00 PM ET (= Tue Oct 27, 2:00 AM PKT)
# Status: DRAFT — do not submit until the demo video is recorded and the
# GitHub repo is public. Fields marked [TODO] need Khizar's hands.

## Project name
BriefMe

## Elevator pitch (tagline)
Paste the mess, get the brief — long documents in, decisions and action items out.

## Thumbnail / gallery
[TODO: screenshot of the app with the product-sync sample brief rendered]

## Try it out links
- Code repository: https://github.com/khizzcr7/briefme — [TODO: create this empty public repo in the GitHub web UI, then run `git push -u origin main` from ~/workspace/small-cash/build-with-ai (local repo is committed and the remote is already set). The agent side cannot do it: connector repo creation returns 403 and gh is not logged in.]
- Demo video: [TODO: YouTube/Vimeo link, 1–3 min screen recording]
- Live demo: local only (`npm start`) — deployment optional for this hackathon.

---

## Project story

### Inspiration
Every team I have worked with runs on documents nobody re-reads. A 45-minute
sync becomes four pages of transcript; the three decisions and five action
items buried in it are what people actually need, and they get missed. I
wanted the smallest possible tool that fixes exactly that: one document in,
the brief out.

### What it does
BriefMe takes a pasted document — meeting notes, an article, an email thread —
and returns a one-page structured brief: a TL;DR, key points, decisions,
action items with owners and due dates, and open questions. Empty sections
say "None stated in the document" instead of being filled with guesses, and
the whole brief copies as Markdown in one click. Three seeded sample
documents let anyone try the full flow immediately.

### How I built it
I followed the Devpost Learn Skill Pack process: scope, PRD, and spec before
any code (all three are in the repo's `devpost/` folder, as the hackathon
requires). The app is a TypeScript + Express server with a dependency-free
frontend. The server calls the Google Gemini API using a JSON response
schema, so the model returns structured data the server can validate — not
prose to scrape. A strict system instruction keeps it honest: extract only
what the document states, never invent owners or dates.

The feature I am happiest with is the failure design. If no Gemini key is
configured — or the API is down or rate-limited — BriefMe falls back to a
deterministic offline extractor that produces the same brief shape, clearly
labelled "demo mode" in the UI and in the output. The demo can never break,
and it never pretends to be the AI.

### Challenges I ran into
Getting extraction honest was harder than getting it working. Early versions
of the offline extractor promoted a question ("Who owns the final call…?")
into a decision because it contained the phrase "final call", and invented an
action-item owner called "Escalating" from the sentence "Escalating to tier
2…". Fixing those two cases taught me more about extraction edge cases than
the happy path ever would: questions are now extracted before decisions, and
decision candidates ending in "?" are rejected outright.

### Accomplishments I'm proud of
- A complete end-to-end proof of concept: paste → structured brief → copyable
  Markdown, in one screen, with no sign-up.
- Structured-output prompting with a validated schema, a repair retry for
  malformed model output, and a labelled fallback — the brief renders the
  same way no matter which path produced it.
- Zero frontend dependencies and a two-command run (`npm install`,
  `npm start`).

### What I learned
Plan-before-code is not ceremony. Writing the scope, PRD, and spec first
surfaced the two hardest decisions — the brief schema and the no-key
fallback — while they were still cheap to change. I also learned that
"extract, don't summarise" is a discipline: the most valuable line in my
system prompt is "never invent owners or dates", and the most valuable UI
decision is showing "None stated" instead of letting the model fill gaps.

### What's next for BriefMe
- File uploads (PDF and Word) and a brief history
- "Brief my week": batch-brief a folder of meeting notes
- Shareable brief links for teams

## Built with
- Node.js, Express, TypeScript
- Google Gemini API (structured JSON output)
- HTML, CSS, JavaScript (vanilla, no framework)
- Devpost Learn Skill Pack (planning process)

## Additional info (form fields)
- Submitter type: Individual
- Country of residence: Pakistan
- New or existing project: New — started from an empty folder during the
  submission period, built with the Devpost Learn Skill Pack; planning docs
  (scope.md, prd.md, spec.md) are in the repository's `devpost/` folder.
- Testing instructions: `npm install`, optionally copy `.env.example` to
  `.env` and add a free Gemini API key from Google AI Studio, then
  `npm run build && npm start` and open http://localhost:3000. Without a key
  the app runs in its labelled offline demo mode. Load any of the three
  sample documents and click "Generate brief".

## Exit survey
[TODO: Khizar answers in his own words at submit time — the Skill Pack is
explicit that submission and survey copy should be learner-written.]
