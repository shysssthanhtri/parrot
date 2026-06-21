import { z } from "zod";

export const SPEECH_TTS_GENERATION_STATUSES = [
  "processing",
  "finished",
  "failed",
] as const;

export type SpeechTtsGenerationStatusValue =
  (typeof SPEECH_TTS_GENERATION_STATUSES)[number];

export const speechTtsGenerationStatusSchema = z.enum(
  SPEECH_TTS_GENERATION_STATUSES
);

export const SPEECH_TTS_GENERATION_STATUS_LABELS: Record<
  SpeechTtsGenerationStatusValue,
  string
> = {
  processing: "Generating",
  finished: "Finished",
  failed: "Failed",
};

export const getSpeechTtsGenerationStatusLabel = (status: string): string => {
  const parsed = speechTtsGenerationStatusSchema.safeParse(status);
  return parsed.success
    ? SPEECH_TTS_GENERATION_STATUS_LABELS[parsed.data]
    : status;
};

export const isSpeechTtsGenerating = (status: SpeechTtsGenerationStatusValue) =>
  status === "processing";

/** @deprecated Use speechTtsGenerationStatusSchema */
export const speechProcessStatusSchema = speechTtsGenerationStatusSchema;

/** @deprecated Use SpeechTtsGenerationStatusValue */
export type SpeechProcessStatus = SpeechTtsGenerationStatusValue;

/** @deprecated Use isSpeechTtsGenerating */
export const isSpeechInProgress = isSpeechTtsGenerating;

/** @deprecated Use getSpeechTtsGenerationStatusLabel */
export const getSpeechProcessStatusLabel = getSpeechTtsGenerationStatusLabel;

/** @deprecated Use SPEECH_TTS_GENERATION_STATUS_LABELS */
export const SPEECH_PROCESS_STATUS_LABELS = SPEECH_TTS_GENERATION_STATUS_LABELS;
