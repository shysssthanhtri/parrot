import "server-only";

import { getRun, start } from "workflow/api";

import { SpeechThumbnailGenerationStatus } from "@/generated/prisma/client";
import { prisma } from "@/prisma";
import { speechThumbnailWorkflow } from "@/workflows/speech-thumbnail";

export async function cancelSpeechThumbnailWorkflow(
  workflowRunId: string
): Promise<void> {
  try {
    await getRun(workflowRunId).cancel();
  } catch (error) {
    console.warn(
      `[speech-thumbnail-workflow] cancel failed for ${workflowRunId}`,
      error
    );
  }
}

export async function startSpeechThumbnailWorkflow(
  speechId: string,
  extraPrompt?: string
): Promise<string> {
  const run = await start(speechThumbnailWorkflow, [speechId, extraPrompt]);

  await prisma.speechThumbnailGeneration.upsert({
    where: { speechId },
    create: {
      speechId,
      status: SpeechThumbnailGenerationStatus.processing,
      workflowRunId: run.runId,
      errorMessage: null,
    },
    update: {
      status: SpeechThumbnailGenerationStatus.processing,
      workflowRunId: run.runId,
      errorMessage: null,
    },
  });

  return run.runId;
}
