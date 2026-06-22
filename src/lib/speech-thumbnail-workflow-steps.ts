import "server-only";

import { SpeechThumbnailGenerationStatus } from "@/generated/prisma/client";
import {
  ensureSpeechThumbnailObjectKey,
  generateAndUploadSpeechThumbnail,
  getUserSafeThumbnailError,
  loadSpeechThumbnailContext,
} from "@/lib/speech-thumbnail-processing";
import { prisma } from "@/prisma";

export async function markSpeechThumbnailProcessingStep(speechId: string) {
  "use step";

  await ensureSpeechThumbnailObjectKey(speechId);
}

export async function generateAndUploadSpeechThumbnailStep(
  speechId: string,
  extraPrompt?: string
) {
  "use step";

  const speech = await loadSpeechThumbnailContext(speechId);
  await generateAndUploadSpeechThumbnail(speech, extraPrompt);
}

export async function finalizeSpeechThumbnailStep(
  speechId: string,
  workflowRunId: string,
  outcome: "finished" | "failed",
  error?: unknown
) {
  "use step";

  const generation = await prisma.speechThumbnailGeneration.findUnique({
    where: { speechId },
    select: { workflowRunId: true },
  });

  if (!generation || generation.workflowRunId !== workflowRunId) {
    console.log(
      `[speech-thumbnail] stale run ${workflowRunId} skipped finalize for ${speechId}`
    );
    return;
  }

  await prisma.speechThumbnailGeneration.update({
    where: { speechId },
    data: {
      status:
        outcome === "finished"
          ? SpeechThumbnailGenerationStatus.finished
          : SpeechThumbnailGenerationStatus.failed,
      errorMessage:
        outcome === "failed" ? getUserSafeThumbnailError(error) : null,
    },
  });
}
