import { z } from "zod";

export const SPEECH_PROCESS_STATUSES = [
  "pending",
  "processing",
  "finished",
  "failed",
] as const;

export type SpeechProcessStatus = (typeof SPEECH_PROCESS_STATUSES)[number];

export const speechProcessStatusSchema = z.enum(SPEECH_PROCESS_STATUSES);

export const SPEECH_CHUNK_STATUSES = ["pending", "done", "failed"] as const;

export type SpeechChunkStatus = (typeof SPEECH_CHUNK_STATUSES)[number];

export const speechChunkStatusSchema = z.enum(SPEECH_CHUNK_STATUSES);

export const SPEECH_PROCESS_STATUS_LABELS: Record<SpeechProcessStatus, string> =
  {
    pending: "Pending",
    processing: "Generating",
    finished: "Finished",
    failed: "Failed",
  };

export const getSpeechProcessStatusLabel = (status: string): string => {
  const parsed = speechProcessStatusSchema.safeParse(status);
  return parsed.success ? SPEECH_PROCESS_STATUS_LABELS[parsed.data] : status;
};

export const isSpeechInProgress = (status: SpeechProcessStatus) =>
  status === "pending" || status === "processing";
