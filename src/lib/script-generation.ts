import "server-only";

import {
  getScriptLanguageLabel,
  type ScriptLanguageCode,
} from "@/lib/script-languages";

import { GEMINI_SCRIPT_MODEL, getGeminiScriptModel } from "./gemini";

export const SCRIPT_GENERATION_LENGTHS = ["short", "medium", "long"] as const;

export type ScriptGenerationLength = (typeof SCRIPT_GENERATION_LENGTHS)[number];

const DURATION_BY_LENGTH: Record<ScriptGenerationLength, string> = {
  short: "30 seconds",
  medium: "1 minute",
  long: "5 minutes",
};

const WORD_COUNT_BY_LENGTH: Record<ScriptGenerationLength, number> = {
  short: 75,
  medium: 150,
  long: 750,
};

export { GEMINI_SCRIPT_MODEL as SCRIPT_GENERATION_MODEL };

type GenerateScriptDraftInput = {
  prompt: string;
  length: ScriptGenerationLength;
  language: ScriptLanguageCode;
  topicNames?: string[];
};

type ScriptDraft = {
  title: string;
  content: string;
};

export function buildScriptGenerationPrompt({
  prompt,
  length,
  language,
  topicNames,
}: GenerateScriptDraftInput): string {
  const languageLabel = getScriptLanguageLabel(language);
  const wordCount = WORD_COUNT_BY_LENGTH[length];
  const duration = DURATION_BY_LENGTH[length];

  const topicLine =
    topicNames && topicNames.length > 0
      ? `\nRelated topics: ${topicNames.join(", ")}\n`
      : "";

  return `You are writing a shadowing practice script for language learners.

Write natural spoken prose in ${languageLabel} (${language}) that a learner can read aloud.
Target approximately ${wordCount} words (${duration} when spoken at a natural pace).
The script should be engaging, clear, and suitable for pronunciation practice.

Topic or instructions from the author:
${prompt}
${topicLine}
Respond with ONLY valid JSON in this exact shape (no markdown, no extra keys):
{"title":"A short descriptive title","content":"The full script text"}`;
}

function parseGeneratedScript(text: string): ScriptDraft {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonText = fencedMatch ? fencedMatch[1].trim() : trimmed;

  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Model returned invalid JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("title" in parsed) ||
    !("content" in parsed) ||
    typeof parsed.title !== "string" ||
    typeof parsed.content !== "string"
  ) {
    throw new Error("Model returned an invalid script shape");
  }

  const title = parsed.title.trim();
  const content = parsed.content.trim();

  if (!title || !content) {
    throw new Error("Model returned empty title or content");
  }

  return { title, content };
}

export async function generateScriptDraft(
  input: GenerateScriptDraftInput
): Promise<ScriptDraft> {
  const model = getGeminiScriptModel();
  const prompt = buildScriptGenerationPrompt(input);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text.trim()) {
    throw new Error("Model returned an empty response");
  }

  return parseGeneratedScript(text);
}
