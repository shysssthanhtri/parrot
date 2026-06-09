import { z } from "zod";

import {
  CHATTERBOX_PROMPT_MAX_CHARS,
  splitTextForTts,
} from "@/lib/speech-text-chunking";

export type SpeechAlignmentSegment = {
  text: string;
  startMs: number;
  endMs: number;
};

export type SpeechScriptAlignment = {
  version: 1;
  segments: SpeechAlignmentSegment[];
};

const speechAlignmentSegmentSchema = z
  .object({
    text: z.string(),
    startMs: z.number().int().nonnegative(),
    endMs: z.number().int().positive(),
  })
  .refine((segment) => segment.endMs > segment.startMs, {
    message: "endMs must be greater than startMs",
  });

export const speechScriptAlignmentSchema = z
  .object({
    version: z.literal(1),
    segments: z.array(speechAlignmentSegmentSchema).min(1),
  })
  .superRefine((alignment, ctx) => {
    const { segments } = alignment;

    if (segments[0].startMs !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "first segment must start at 0ms",
        path: ["segments", 0, "startMs"],
      });
    }

    for (let index = 0; index < segments.length - 1; index += 1) {
      if (segments[index].endMs !== segments[index + 1].startMs) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `segments must be contiguous between index ${index} and ${index + 1}`,
          path: ["segments", index, "endMs"],
        });
      }
    }
  });

/** Default tolerance when comparing alignment duration to measured audio length. */
export const ALIGNMENT_AUDIO_DURATION_TOLERANCE_MS = 50;

export function joinAlignmentSegmentTexts(
  segments: SpeechAlignmentSegment[]
): string {
  return segments.map((segment) => segment.text).join("");
}

/**
 * Collapse internal whitespace for order-preserving script comparison.
 * Segment texts are joined without separators, matching TTS chunk output.
 */
export function normalizeScriptText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

export function alignmentTextMatchesScript(
  alignment: SpeechScriptAlignment,
  scriptContent: string
): boolean {
  const joined = joinAlignmentSegmentTexts(alignment.segments);
  return normalizeScriptText(joined) === normalizeScriptText(scriptContent);
}

export function alignmentSegmentsMatchScriptChunks(
  alignment: SpeechScriptAlignment,
  scriptContent: string,
  maxChars = CHATTERBOX_PROMPT_MAX_CHARS
): boolean {
  const chunks = splitTextForTts(scriptContent, maxChars);

  if (chunks.length !== alignment.segments.length) {
    return false;
  }

  return alignment.segments.every(
    (segment, index) => segment.text === chunks[index]
  );
}

export function alignmentMatchesAudioDuration(
  alignment: SpeechScriptAlignment,
  durationMs: number,
  toleranceMs = ALIGNMENT_AUDIO_DURATION_TOLERANCE_MS
): boolean {
  const lastSegment = alignment.segments[alignment.segments.length - 1];
  return Math.abs(lastSegment.endMs - durationMs) <= toleranceMs;
}

export function resolveActiveAlignmentSegment(
  alignment: SpeechScriptAlignment,
  timeMs: number
): { segment: SpeechAlignmentSegment; index: number } {
  const { segments } = alignment;
  const lastIndex = segments.length - 1;

  if (timeMs < segments[0].startMs) {
    return { segment: segments[0], index: 0 };
  }

  if (timeMs >= segments[lastIndex].endMs) {
    return { segment: segments[lastIndex], index: lastIndex };
  }

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (segment.startMs <= timeMs && timeMs < segment.endMs) {
      return { segment, index };
    }
  }

  return { segment: segments[lastIndex], index: lastIndex };
}
