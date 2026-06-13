import { getScriptLanguageLabel } from "./script-languages";

export const SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH = 5000;

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
  speech: SpeechThumbnailPromptContext
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
  const fixedSegments = [titleLine, topicHint, languageLine, styleLine].filter(
    Boolean
  );
  const fixedPrompt = fixedSegments.join(" ");
  const content = speech.script.content.trim();

  if (content.length === 0) {
    return fixedPrompt;
  }

  const storyPrefix = 'Story/subject: "';
  const storySuffix = '"';
  const contentBudget =
    SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH -
    fixedPrompt.length -
    1 -
    storyPrefix.length -
    storySuffix.length;

  if (contentBudget <= 0) {
    return fixedPrompt;
  }

  const excerpt = truncateForThumbnailPrompt(content, contentBudget);
  const storySegment = `${storyPrefix}${excerpt}${storySuffix}`;
  const segments = [
    titleLine,
    topicHint,
    storySegment,
    languageLine,
    styleLine,
  ].filter(Boolean);

  return segments.join(" ");
}
