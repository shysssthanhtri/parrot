import "server-only";

import { env } from "@/lib/env";
import { type ScriptLanguageCode } from "@/lib/script-languages";

import { GEMINI_SCRIPT_MODEL } from "./gemini";
import { generateText } from "./llm";
import { VERCEL_GATEWAY_MODEL } from "./llm/vercel-gateway";
import {
  buildScriptGenerationPrompt,
  SCRIPT_GENERATION_LENGTHS,
  type ScriptGenerationLength,
  type ScriptGenerationTopic,
} from "./script-generation-prompt";

export {
  buildScriptGenerationPrompt,
  SCRIPT_GENERATION_LENGTHS,
  type ScriptGenerationLength,
  type ScriptGenerationTopic,
};

export function getScriptGenerationModel(): string {
  const providerId = env.LLM_PROVIDER ?? "vercel-ai-gateway";
  return providerId === "gemini" ? GEMINI_SCRIPT_MODEL : VERCEL_GATEWAY_MODEL;
}

type GenerateScriptDraftInput = {
  prompt: string;
  length: ScriptGenerationLength;
  language: ScriptLanguageCode;
  topics?: ScriptGenerationTopic[];
};

type ScriptDraft = {
  title: string;
  content: string;
};

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
  const prompt = buildScriptGenerationPrompt(input);
  const { text } = await generateText(prompt);

  return parseGeneratedScript(text);
}
