import {
  isSpeechInProgress,
  type SpeechProcessStatus,
} from "./speech-process-status.ts";

export type SpeechGenerationProgressPhase =
  | "starting"
  | "synthesizing"
  | "finalizing";

export type SpeechGenerationProgress = {
  phase: SpeechGenerationProgressPhase;
  percent: number;
  settledChunks: number;
  totalChunks: number;
  label: string;
};

export function getSpeechGenerationProgress(
  processStatus: SpeechProcessStatus,
  totalChunks: number,
  settledChunks: number
): SpeechGenerationProgress | null {
  if (!isSpeechInProgress(processStatus)) {
    return null;
  }

  if (processStatus === "pending" || totalChunks === 0) {
    return {
      phase: "starting",
      percent: 0,
      settledChunks: 0,
      totalChunks: 0,
      label: "Starting generation…",
    };
  }

  if (settledChunks >= totalChunks) {
    return {
      phase: "finalizing",
      percent: 100,
      settledChunks,
      totalChunks,
      label: "Finalizing audio…",
    };
  }

  const percent = Math.round((settledChunks / totalChunks) * 100);

  return {
    phase: "synthesizing",
    percent,
    settledChunks,
    totalChunks,
    label: `Generating audio — ${percent}% (${settledChunks} of ${totalChunks} chunks)`,
  };
}
