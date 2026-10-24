import express, { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { demoBrief } from "./demoBrief";
import { GeminiError, generateBriefWithGemini } from "./gemini";
import { SAMPLES } from "./samples";
import {
  DOC_TYPES,
  MAX_TEXT_LENGTH,
  MIN_TEXT_LENGTH,
  type DocType,
} from "./types";

// Minimal .env loader (avoids a dependency): fills process.env from a local
// .env file when the variables are not already set.
function loadDotEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadDotEnv();

const PORT = Number(process.env.PORT ?? 3000);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY ?? "").trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL ?? "gemini-2.5-flash").trim();
const MODE: "gemini" | "demo" = GEMINI_API_KEY ? "gemini" : "demo";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, mode: MODE, model: MODE === "gemini" ? GEMINI_MODEL : null });
});

app.get("/api/samples", (_req: Request, res: Response) => {
  res.json({ samples: SAMPLES });
});

app.post("/api/brief", async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const text = typeof body.text === "string" ? body.text : "";
  const docType: DocType = DOC_TYPES.includes(body.docType as DocType)
    ? (body.docType as DocType)
    : "general";
  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 120)
      : "Untitled document";

  if (text.trim().length < MIN_TEXT_LENGTH) {
    res.status(400).json({
      error: `That document is too short to brief. Paste at least ${MIN_TEXT_LENGTH} characters (about a paragraph or two).`,
    });
    return;
  }
  if (text.length > MAX_TEXT_LENGTH) {
    res.status(400).json({
      error: `That document is too long for one brief (max ${MAX_TEXT_LENGTH.toLocaleString()} characters). Split it into sections and brief each one.`,
    });
    return;
  }

  if (MODE === "demo") {
    res.json({
      ...demoBrief(title, text, docType),
      notice:
        "Offline demo mode: no Gemini API key is configured, so this brief was produced by a simple local extractor. Add GEMINI_API_KEY to .env for AI briefs.",
    });
    return;
  }

  try {
    const brief = await generateBriefWithGemini({
      apiKey: GEMINI_API_KEY,
      model: GEMINI_MODEL,
      title,
      docType,
      text,
    });
    res.json(brief);
  } catch (err) {
    if (err instanceof GeminiError) {
      if (err.kind === "auth") {
        res.status(502).json({ error: err.message });
        return;
      }
      if (err.kind === "rate" || err.kind === "network" || err.kind === "api" || err.kind === "malformed") {
        // Keep the demo unbreakable: fall back, clearly labelled.
        res.json({
          ...demoBrief(title, text, docType),
          notice: `The Gemini API was unavailable (${err.message}) so this brief came from the offline demo extractor.`,
        });
        return;
      }
    }
    res.status(500).json({ error: "Something went wrong generating the brief. Try again." });
  }
});

app.listen(PORT, () => {
  console.log(`BriefMe running at http://localhost:${PORT} (mode: ${MODE})`);
});
