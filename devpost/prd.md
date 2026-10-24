---
status: approved
project: BriefMe
depends_on: scope.md
---

# PRD — BriefMe

## Experience in one line

Paste the mess, get the brief. One screen, no sign-up, answer in seconds.

## Screen layout (single page)

1. **Header** — product name, one-line promise, and a small mode badge that
   honestly shows whether answers come from Gemini or the offline demo mode.
2. **Input panel**
   - A document-type selector (Meeting notes / Article / Email thread /
     General) — it tunes the brief's emphasis.
   - Large textarea with a character count and gentle length guidance
     (minimum ~200 characters, maximum 60,000).
   - Three sample chips ("Try a sample: Product sync · Research article ·
     Support thread") that fill the textarea with a seeded document.
   - Primary button: **Generate brief**.
3. **Brief panel** (appears after generation)
   - TL;DR highlighted at the top.
   - Cards for Key points, Decisions, Action items (rendered as a checklist
     table with owner and due columns), and Open questions.
   - Empty sections show a quiet "None stated in the document." instead of
     disappearing, so the brief's shape is predictable.
   - **Copy as Markdown** button with a "Copied" confirmation.
4. **Footer** — one line on how it works and the hackathon credit.

## Behaviour

- Loading state on the button ("Reading your document…") and a subtle
  progress shimmer on the brief panel; the input is never lost on error.
- Friendly, specific errors: too short, too long, API key missing/invalid,
  rate limited, network down. Each error says what to do next.
- Keyboard friendly: labelled controls, focus visible, button reachable by
  Tab; the brief region is announced politely to screen readers.

## Visual style

- Calm "paper and ink" editorial look: warm off-white background, deep ink
  text, one accent colour (signal orange) used sparingly.
- Serif display headings, clean sans body, generous spacing — it should feel
  like a well-set briefing document, not a dashboard.
- Fully responsive; input and brief stack on narrow screens.

## Edge cases

- Document with no decisions or actions → those cards say "None stated".
- Very long paste → hard cap with a clear message (60,000 characters).
- Gemini returns malformed JSON → server retries once with a stricter
  prompt, then falls back to demo-mode extraction labelled as such.
- No API key at all → demo mode from the start, badge shows it, nothing
  crashes.
