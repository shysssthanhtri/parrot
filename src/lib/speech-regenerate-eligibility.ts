export const REGENERATE_STUCK_THRESHOLD_MS = 30 * 60 * 1000;

type SpeechRegenerateEligibilityInput = {
  processStatus: string;
  processingStartedAt: Date | null;
};

export function canRegenerateSpeech(speech: SpeechRegenerateEligibilityInput) {
  const { processStatus } = speech;

  if (
    processStatus === "finished" ||
    processStatus === "pending" ||
    processStatus === "failed"
  ) {
    return true;
  }

  if (processStatus === "processing") {
    if (!speech.processingStartedAt) {
      return true;
    }

    return (
      Date.now() - speech.processingStartedAt.getTime() >=
      REGENERATE_STUCK_THRESHOLD_MS
    );
  }

  return false;
}
