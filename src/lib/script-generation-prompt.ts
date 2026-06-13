import {
  getScriptLanguageLabel,
  type ScriptLanguageCode,
} from "./script-languages";

export const SCRIPT_GENERATION_LENGTHS = ["short", "medium", "long"] as const;

export type ScriptGenerationLength = (typeof SCRIPT_GENERATION_LENGTHS)[number];

const SCRIPT_LENGTH_LABELS: Record<ScriptGenerationLength, string> = {
  short: "Short (~30 seconds)",
  medium: "Medium (~1 minute)",
  long: "Long (~5 minutes)",
};

export const SCRIPT_LENGTH_OPTIONS = SCRIPT_GENERATION_LENGTHS.map((value) => ({
  value,
  label: SCRIPT_LENGTH_LABELS[value],
}));

export function getScriptLengthLabel(length: ScriptGenerationLength): string {
  return SCRIPT_LENGTH_LABELS[length];
}

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

export type ScriptGenerationTopic = {
  name: string;
  description?: string | null;
};

type BuildScriptGenerationPromptInput = {
  prompt: string;
  length: ScriptGenerationLength;
  language: ScriptLanguageCode;
  topics?: ScriptGenerationTopic[];
};

function formatTopicForPrompt(topic: ScriptGenerationTopic): string {
  const description = topic.description?.trim();
  return description ? `${topic.name}: ${description}` : topic.name;
}

export function buildScriptGenerationPrompt({
  prompt,
  length,
  language,
  topics,
}: BuildScriptGenerationPromptInput): string {
  const languageLabel = getScriptLanguageLabel(language);
  const wordCount = WORD_COUNT_BY_LENGTH[length];
  const duration = DURATION_BY_LENGTH[length];

  const topicLine =
    topics && topics.length > 0
      ? `\nRelated topics:\n${topics.map((topic) => `- ${formatTopicForPrompt(topic)}`).join("\n")}\n`
      : "";

  return `You are writing a shadowing practice script for language learners.

Write natural spoken prose in ${languageLabel} (${language}) that a learner can read aloud.
Target approximately ${wordCount} words (${duration} when spoken at a natural pace).
The script should be engaging, clear, and suitable for pronunciation practice.
Structure the content in paragraphs where natural, separating paragraphs with blank lines.

Topic or instructions from the author:
${prompt}
${topicLine}
Respond with ONLY valid JSON in this exact shape (no markdown, no extra keys):
{"title":"A short descriptive title","content":"The full script text"}`;
}
