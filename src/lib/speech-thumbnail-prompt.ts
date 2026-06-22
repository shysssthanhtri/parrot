import { getScriptLanguageLabel } from "./script-languages";

export const SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH = 5000;
export const SPEECH_THUMBNAIL_EXTRA_PROMPT_MAX_LENGTH = 500;

export type SpeechThumbnailPromptContext = {
  language: string;
  script: {
    title: string;
    content: string;
    topics: {
      name: string;
      color: string;
    }[];
  };
};

export function truncateForThumbnailPrompt(
  text: string,
  maxLength: number
): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  if (maxLength <= 1) {
    return trimmed.slice(0, maxLength);
  }

  const slice = trimmed.slice(0, maxLength - 1);
  const lastSpace = slice.lastIndexOf(" ");

  if (lastSpace > 0) {
    return `${slice.slice(0, lastSpace)}…`;
  }

  return `${slice}…`;
}

export function buildSpeechThumbnailPrompt(
  speech: SpeechThumbnailPromptContext,
  extraPrompt?: string
): string {
  const languageLabel = getScriptLanguageLabel(speech.language);
  const topicHint =
    speech.script.topics.length > 0
      ? `Themes: ${speech.script.topics
          .map((topic) => `${topic.name} (${topic.color})`)
          .join(", ")}.`
      : "";

  const styleLine =
    "Soft cinematic lighting, abstract composition, rich color, no text, no letters, no typography, no words.";

  const titleLine = `Editorial portrait cover art for a language-learning speech titled "${speech.script.title}".`;
  const languageLine = `Inspired by ${languageLabel} language learning.`;
  const head = [titleLine, topicHint].filter(Boolean);
  const tail = [languageLine, styleLine];

  const storyPrefix = 'Story/subject: "';
  const storySuffix = '"';
  const authorPrefix = 'Author direction: "';
  const authorSuffix = '"';

  const trimmedExtra = extraPrompt?.trim() ?? "";
  const rawContent = speech.script.content.trim();

  const build = (contentExcerpt: string, authorText: string): string => {
    const parts: string[] = [...head];
    if (contentExcerpt) {
      parts.push(`${storyPrefix}${contentExcerpt}${storySuffix}`);
    }
    if (authorText) {
      parts.push(`${authorPrefix}${authorText}${authorSuffix}`);
    }
    parts.push(...tail);
    return parts.join(" ");
  };

  let contentExcerpt = "";
  if (rawContent) {
    const withoutStory = build("", trimmedExtra);
    const contentBudget =
      SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH -
      withoutStory.length -
      storyPrefix.length -
      storySuffix.length -
      1;
    contentExcerpt =
      contentBudget > 0
        ? truncateForThumbnailPrompt(rawContent, contentBudget)
        : "";
  }

  let authorText = trimmedExtra;
  if (authorText) {
    const authorBudget =
      SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH -
      build(contentExcerpt, "").length -
      authorPrefix.length -
      authorSuffix.length -
      1;
    authorText =
      authorBudget > 0
        ? truncateForThumbnailPrompt(authorText, authorBudget)
        : "";
  }

  let prompt = build(contentExcerpt, authorText);
  if (prompt.length > SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH) {
    prompt = truncateForThumbnailPrompt(
      prompt,
      SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH
    );
  }

  return prompt;
}
