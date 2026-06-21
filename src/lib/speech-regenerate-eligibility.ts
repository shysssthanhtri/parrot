import type { SpeechTtsGenerationStatus } from "@/generated/prisma/client";

export const REGENERATE_STUCK_THRESHOLD_MS = 30 * 60 * 1000;

type SpeechRegenerateEligibilityInput = {
  ttsGeneration: {
    status: SpeechTtsGenerationStatus;
    processingStartedAt: Date | null;
  } | null;
};

export function canRegenerateSpeech(speech: SpeechRegenerateEligibilityInput) {
  const status = speech.ttsGeneration?.status;

  if (!status || status === "finished" || status === "failed") {
    return true;
  }

  if (status === "processing") {
    if (!speech.ttsGeneration?.processingStartedAt) {
      return true;
    }

    return (
      Date.now() - speech.ttsGeneration.processingStartedAt.getTime() >=
      REGENERATE_STUCK_THRESHOLD_MS
    );
  }

  return false;
}
