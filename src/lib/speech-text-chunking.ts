/** Safe per-request prompt size (Chatterbox API hard cap is 5000). */
export const CHATTERBOX_PROMPT_MAX_CHARS = 400;

const PERIOD_END_PATTERN = /\.(?:\s|$)/g;

function findLatestPeriodBreak(window: string): number {
  let lastEnd = 0;
  PERIOD_END_PATTERN.lastIndex = 0;

  for (
    let match = PERIOD_END_PATTERN.exec(window);
    match !== null;
    match = PERIOD_END_PATTERN.exec(window)
  ) {
    lastEnd = match.index + match[0].length;
  }

  return lastEnd;
}

function findBreakIndex(window: string): number {
  return findLatestPeriodBreak(window);
}

/**
 * Split script text into ordered TTS-safe chunks, preferring breaks at
 * period endings before hard-splitting.
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
