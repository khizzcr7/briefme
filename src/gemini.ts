import type { ActionItem, Brief, DocType } from "./types";

export type GeminiErrorKind = "auth" | "rate" | "malformed" | "network" | "api";

export class GeminiError extends Error {
  kind: GeminiErrorKind;
  constructor(kind: GeminiErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

const DOC_GUIDANCE: Record<DocType, string> = {
  meeting:
    "This is a meeting transcript or meeting notes. Decisions and action items matter most. Owners are the people named in the text; keep their names exactly as written. Due dates only when the text states them.",
  article:
    "This is an article or report. Key points should carry the author's argument and evidence. Decisions will usually be empty. Open questions are the unresolved issues the article itself raises.",
  email:
    "This is an email thread. Track who committed to what across messages. Decisions are agreements the thread actually reached. Action items come from explicit commitments in the messages.",
  general:
    "This is a general document. Balance all sections and only extract what is genuinely there.",
};

const SYSTEM_INSTRUCTION = [
  "You are BriefMe, an expert analyst who converts long documents into short, decision-ready briefs.",
  "Extract ONLY what the document states. Never invent facts, decisions, owners, or dates.",
  "If a section has nothing stated in the document, return an empty list for it.",
  "For action items, owner and due must be null unless the document names them.",
  "Keep the TL;DR under 60 words and in plain language.",
  "Keep every key point to one sentence. Quote figures and names exactly as the document gives them.",
].join(" ");

const BRIEF_SCHEMA = {
  type: "OBJECT",
  properties: {
    tldr: { type: "STRING" },
    keyPoints: { type: "ARRAY", items: { type: "STRING" } },
    decisions: { type: "ARRAY", items: { type: "STRING" } },
    actionItems: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          task: { type: "STRING" },
          owner: { type: "STRING", nullable: true },
          due: { type: "STRING", nullable: true },
        },
        required: ["task"],
      },
    },
    openQuestions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["tldr", "keyPoints", "decisions", "actionItems", "openQuestions"],
} as const;

function asStringArray(value: unknown, cap: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, cap);
}

function normalise(raw: unknown, title: string, text: string): Brief {
  if (typeof raw !== "object" || raw === null) {
    throw new GeminiError("malformed", "Gemini returned a non-object response.");
  }
  const obj = raw as Record<string, unknown>;
  if (typeof obj.tldr !== "string" || obj.tldr.trim().length === 0) {
    throw new GeminiError("malformed", "Gemini response was missing a TL;DR.");
  }
  const actionItems: ActionItem[] = Array.isArray(obj.actionItems)
    ? obj.actionItems
        .filter(
          (v): v is Record<string, unknown> =>
            typeof v === "object" && v !== null && typeof v.task === "string"
        )
        .map((v) => ({
          task: String(v.task).trim(),
          owner:
            typeof v.owner === "string" && v.owner.trim() ? v.owner.trim() : null,
          due: typeof v.due === "string" && v.due.trim() ? v.due.trim() : null,
        }))
        .filter((v) => v.task.length > 0)
        .slice(0, 12)
    : [];

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return {
    title,
    tldr: obj.tldr.trim(),
    keyPoints: asStringArray(obj.keyPoints, 8),
    decisions: asStringArray(obj.decisions, 8),
    actionItems,
    openQuestions: asStringArray(obj.openQuestions, 8),
    mode: "gemini",
    readingTimeSavedMinutes: Math.max(1, Math.round(wordCount / 200) - 1),
  };
}

async function callGemini(
  apiKey: string,
  model: string,
  title: string,
  docType: DocType,
  text: string,
  repair: boolean
): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent`;

  const userPrompt = [
    `Document type guidance: ${DOC_GUIDANCE[docType]}`,
    `Document title: ${title}`,
    repair
      ? "Your previous answer was not valid JSON for the required schema. Return ONLY the JSON object, exactly matching the schema."
      : "",
    "--- DOCUMENT START ---",
    text,
    "--- DOCUMENT END ---",
  ]
    .filter(Boolean)
    .join("\n");

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: BRIEF_SCHEMA,
        },
      }),
    });
  } catch {
    throw new GeminiError("network", "Could not reach the Gemini API.");
  }

  if (!res.ok) {
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      throw new GeminiError(
        "auth",
        "The Gemini API rejected the request. Check that GEMINI_API_KEY is a valid key from Google AI Studio."
      );
    }
    if (res.status === 429) {
      throw new GeminiError(
        "rate",
        "The Gemini API rate limit was hit. Wait a few seconds and try again."
      );
    }
    throw new GeminiError("api", `The Gemini API returned HTTP ${res.status}.`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const candidates = data.candidates as
    | Array<{ content?: { parts?: Array<{ text?: string }> } }>
    | undefined;
  const rawText = candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new GeminiError("malformed", "Gemini returned an empty response.");
  }
  try {
    return JSON.parse(rawText);
  } catch {
    throw new GeminiError("malformed", "Gemini returned invalid JSON.");
  }
}

export async function generateBriefWithGemini(opts: {
  apiKey: string;
  model: string;
  title: string;
  docType: DocType;
  text: string;
}): Promise<Brief> {
  const { apiKey, model, title, docType, text } = opts;
  try {
    const raw = await callGemini(apiKey, model, title, docType, text, false);
    return normalise(raw, title, text);
  } catch (err) {
    if (err instanceof GeminiError && err.kind === "malformed") {
      // One repair attempt with a stricter prompt, per spec.
      const raw = await callGemini(apiKey, model, title, docType, text, true);
      return normalise(raw, title, text);
    }
    throw err;
  }
}
