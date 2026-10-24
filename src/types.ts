export type DocType = "meeting" | "article" | "email" | "general";

export interface ActionItem {
  task: string;
  owner: string | null;
  due: string | null;
}

export interface Brief {
  title: string;
  tldr: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  openQuestions: string[];
  /** "gemini" when produced by the Gemini API, "demo" for the offline fallback. */
  mode: "gemini" | "demo";
  /** Rough estimate of reading time the brief saves, in minutes. */
  readingTimeSavedMinutes: number;
  /** Optional human-readable note, e.g. why demo mode was used. */
  notice?: string;
}

export interface SampleDoc {
  id: string;
  title: string;
  docType: DocType;
  text: string;
}

export const DOC_TYPES: DocType[] = ["meeting", "article", "email", "general"];

export const MIN_TEXT_LENGTH = 200;
export const MAX_TEXT_LENGTH = 60_000;
