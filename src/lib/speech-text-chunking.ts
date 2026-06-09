/** Safe per-request prompt size (Chatterbox API hard cap is 5000). */
export const CHATTERBOX_PROMPT_MAX_CHARS = 400;

const SENTENCE_CLOSERS = new Set([".", "!", "?", "。", "！", "？"]);

function skipTrailingInlineWhitespace(window: string, start: number): number {
  let end = start;
  while (end < window.length && (window[end] === " " || window[end] === "\t")) {
    end += 1;
  }
  return end;
}

function findLatestParagraphBreak(window: string): number {
  let lastEnd = 0;
  let index = 0;

  while (index < window.length) {
    const match = window.indexOf("\n\n", index);
    if (match === -1) {
      break;
    }

    lastEnd = skipTrailingInlineWhitespace(window, match + 2);
    index = match + 2;
  }

  return lastEnd;
}

function findLatestLineBreak(window: string): number {
  let lastEnd = 0;

  for (let index = 0; index < window.length; index += 1) {
    if (window[index] !== "\n") {
      continue;
    }

    if (
      window[index + 1] === "\n" ||
      (index > 0 && window[index - 1] === "\n")
    ) {
      continue;
    }

    lastEnd = skipTrailingInlineWhitespace(window, index + 1);
  }

  return lastEnd;
}

function isPeriodInEllipsisRun(window: string, index: number): boolean {
  if (window[index] !== ".") {
    return false;
  }

  return window[index - 1] === "." || window[index + 1] === ".";
}

function ellipsisBreakEnd(window: string, index: number): number | null {
  let length = 0;

  if (window[index] === "…") {
    length = 1;
  } else if (window.slice(index, index + 3) === "...") {
    length = 3;
  } else if (
    window.slice(index, index + 2) === ".." &&
    window[index + 2] !== "."
  ) {
    length = 2;
  } else {
    return null;
  }

  const afterEllipsis = index + length;
  let end = afterEllipsis;
  while (end < window.length && /\s/.test(window[end])) {
    end += 1;
  }

  if (end >= window.length) {
    return end;
  }

  const nextChar = window[end];
  if (nextChar >= "A" && nextChar <= "Z") {
    return end;
  }

  return null;
}

function regularSentenceBreakEnd(window: string, index: number): number | null {
  const char = window[index];
  if (!SENTENCE_CLOSERS.has(char)) {
    return null;
  }

  if (char === "." && isPeriodInEllipsisRun(window, index)) {
    return null;
  }

  const afterPunctuation = index + 1;
  if (afterPunctuation >= window.length) {
    return afterPunctuation;
  }

  if (!/\s/.test(window[afterPunctuation])) {
    return null;
  }

  return skipTrailingInlineWhitespace(window, afterPunctuation);
}

function findLatestSentenceBreak(window: string): number {
  let lastEnd = 0;

  for (let index = 0; index < window.length; index += 1) {
    const ellipsisEnd = ellipsisBreakEnd(window, index);
    if (ellipsisEnd !== null && ellipsisEnd > lastEnd) {
      lastEnd = ellipsisEnd;
      index = ellipsisEnd - 1;
      continue;
    }

    const sentenceEnd = regularSentenceBreakEnd(window, index);
    if (sentenceEnd !== null && sentenceEnd > lastEnd) {
      lastEnd = sentenceEnd;
    }
  }

  return lastEnd;
}

function findBreakIndex(window: string): number {
  const paragraphBreak = findLatestParagraphBreak(window);
  if (paragraphBreak > 0) {
    return paragraphBreak;
  }

  const lineBreak = findLatestLineBreak(window);
  if (lineBreak > 0) {
    return lineBreak;
  }

  const sentenceBreak = findLatestSentenceBreak(window);
  if (sentenceBreak > 0) {
    return sentenceBreak;
  }

  return 0;
}

/**
 * Split script text into ordered TTS-safe chunks, preferring breaks at
 * paragraph, line, and sentence boundaries before hard-splitting.
 */
export function splitTextForTts(
  text: string,
  maxChars = CHATTERBOX_PROMPT_MAX_CHARS
): string[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (trimmed.length <= maxChars) {
    return [trimmed];
  }

  const chunks: string[] = [];
  let remaining = trimmed;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }

    const window = remaining.slice(0, maxChars);
    const breakIndex = findBreakIndex(window);

    if (breakIndex > 0) {
      const chunk = remaining.slice(0, breakIndex).trimEnd();
      if (chunk.length === 0) {
        chunks.push(remaining.slice(0, maxChars));
        remaining = remaining.slice(maxChars).trimStart();
        continue;
      }

      chunks.push(chunk);
      remaining = remaining.slice(breakIndex).trimStart();
      continue;
    }

    chunks.push(remaining.slice(0, maxChars));
    remaining = remaining.slice(maxChars).trimStart();
  }

  return chunks;
}
