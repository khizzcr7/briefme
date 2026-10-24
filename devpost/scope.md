---
status: approved
project: BriefMe
hackathon: Build With AI: Basics (Devpost Learn)
---

# Scope — BriefMe

## The idea

Knowledge workers drown in long documents: meeting transcripts, research
articles, feedback threads. The useful part — what was decided, who owes
what, what is still open — is buried in paragraphs. BriefMe turns one pasted
document into a one-page, decision-ready brief in seconds.

## The kernel (the one thing it must do end to end)

Paste a document → get a structured brief back:

- **TL;DR** — two or three sentences, the whole document in miniature.
- **Key points** — the facts and arguments that matter.
- **Decisions** — what was actually agreed, if anything.
- **Action items** — task, owner, and due date where the text states them.
- **Open questions** — what the document leaves unresolved.

Plus one click to copy the whole brief as Markdown, so it drops straight
into notes, email, or a team wiki.

## Who it is for

Anyone whose job runs on documents: product and engineering teams after a
sync, founders reading research, support leads triaging feedback, students
facing a 40-page reading. The demo ships with three seeded sample documents
so a judge can see the full flow without hunting for a document of their own.

## Definition of "done" for this proof of concept

- One server endpoint that takes a document and returns the structured brief.
- Real AI path via the Gemini API with structured JSON output when a key is
  configured.
- A clearly labelled offline demo mode (deterministic local extraction) so
  the app still runs end to end with no key and no network — the demo never
  silently breaks.
- A single polished page: paste area, sample chips, brief rendered as clean
  cards, copy-as-Markdown.
- Runs with `npm install && npm start`. No database, no accounts, no paid
  services.

## Explicitly out of scope (later, not now)

- File uploads (PDF/Word parsing), accounts, saved history, sharing links.
- Multiple documents at once, chat-with-your-document.
- Deployment — optional for this hackathon; local run is the deliverable.
