import type { ActionItem, Brief, DocType } from "./types";

/**
 * Demo-mode brief generator.
 *
 * A deterministic, offline extractor used when no Gemini API key is
 * configured (or the API is unreachable). It is deliberately simple and is
 * always labelled "demo" in the response and the UI — it never pretends to
 * be the AI.
 */

const STOP_WORDS = new Set(
  (
    "the a an and or but if then else when while of at by for with about into through after over between " +
    "is are was were be been being have has had do does did will would shall should can could may might must " +
    "i you he she it we they them his her its our their this that these those there here what which who whom " +
    "to from as in on not no yes so than too very just also more most other some any only own same"
  ).split(" ")
);

function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const parts = cleaned.match(/[^.!?]+[.!?]+["')\]]*\s*/g) ?? [cleaned];
  return parts.map((s) => s.trim()).filter((s) => s.length > 25);
}

function wordFreq(sentences: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const s of sentences) {
    for (const raw of s.toLowerCase().match(/[a-z][a-z'-]+/g) ?? []) {
      if (!STOP_WORDS.has(raw) && raw.length > 2) {
        freq.set(raw, (freq.get(raw) ?? 0) + 1);
      }
    }
  }
  return freq;
}

function score(sentence: string, freq: Map<string, number>): number {
  const words = sentence.toLowerCase().match(/[a-z][a-z'-]+/g) ?? [];
  if (words.length === 0) return 0;
  let total = 0;
  for (const w of words) total += freq.get(w) ?? 0;
  // Favour medium-length sentences; very long ones are usually rambling.
  return total / Math.sqrt(words.length);
}

const DECISION_RE =
  /\b(decided|decision|agreed|confirmed|approved|settled on|final call|we will go with|signed off)\b/i;
const QUESTION_RE =
  /(\?\s*$|\b(TBD|open questions?|need to confirm|unclear|not sure|unsure|nobody was sure|no one was sure|still not defined|remains open|still open)\b)/i;
/** Sentence-initial words that are not people's names (owner false positives). */
const NOT_A_NAME = new Set([
  "escalating", "subject", "from", "note", "update", "still", "this", "the",
  "we", "it", "there", "overall", "closing", "summary", "however", "meanwhile",
]);
const DUE_RE =
  /\b(by|before|on)\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|tomorrow|next week|end of (the )?week|EOD|end of day|\d{1,2}(st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\b/i;
const OWNER_WILL_RE = /^([A-Z][a-z]+)\s+(will|is to|needs to|should)\s+(.+)$/;
const OWNER_TO_RE = /^([A-Z][a-z]+)\s+to\s+(.+)$/;

function extractActionItems(sentences: string[]): ActionItem[] {
  const items: ActionItem[] = [];
  for (const s of sentences) {
    let owner: string | null = null;
    let task: string | null = null;

    const willMatch = s.match(OWNER_WILL_RE);
    const toMatch = willMatch ? null : s.match(OWNER_TO_RE);
    if (willMatch) {
      owner = willMatch[1];
      task = `${willMatch[3]}`;
    } else if (toMatch && !NOT_A_NAME.has(toMatch[1].toLowerCase())) {
      owner = toMatch[1];
      task = toMatch[2];
    } else if (/\b(action item|todo|to-do)\b/i.test(s)) {
      task = s;
    }

    if (task) {
      const dueMatch = task.match(DUE_RE);
      const due = dueMatch ? dueMatch[0] : null;
      if (due) task = task.replace(dueMatch![0], "").replace(/\s{2,}/g, " ").trim();
      task = task.replace(/[.\s]+$/, "");
      if (task.length > 8) {
        items.push({
          task: task.charAt(0).toUpperCase() + task.slice(1),
          owner,
          due,
        });
      }
    }
    if (items.length >= 8) break;
  }
  return items;
}

export function demoBrief(title: string, text: string, _docType: DocType): Brief {
  const sentences = splitSentences(text);
  const freq = wordFreq(sentences);
  const ranked = sentences
    .map((s, i) => ({ s, i, score: score(s, freq) }))
    .sort((a, b) => b.score - a.score);

  const used = new Set<string>();
  const take = (list: string[], n: number): string[] => {
    const out: string[] = [];
    for (const s of list) {
      if (out.length >= n) break;
      if (!used.has(s)) {
        used.add(s);
        out.push(s);
      }
    }
    return out;
  };

  const byRank = ranked.map((r) => r.s);
  // Questions first: a sentence ending in "?" is never a decision, even if it
  // happens to contain a phrase like "final call".
  const questions = take(sentences.filter((s) => QUESTION_RE.test(s)), 5);
  const decisions = take(
    sentences.filter((s) => DECISION_RE.test(s) && !s.trimEnd().endsWith("?")),
    5
  );
  const actionItems = extractActionItems(sentences);
  for (const item of actionItems) used.add(item.task);
  const tldrSentences = take(byRank, 2).sort(
    (a, b) => sentences.indexOf(a) - sentences.indexOf(b)
  );
  const keyPoints = take(byRank, 5).sort(
    (a, b) => sentences.indexOf(a) - sentences.indexOf(b)
  );

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const saved = Math.max(1, Math.round(wordCount / 200) - 1);

  return {
    title,
    tldr: tldrSentences.join(" "),
    keyPoints,
    decisions,
    actionItems,
    openQuestions: questions,
    mode: "demo",
    readingTimeSavedMinutes: saved,
  };
}
