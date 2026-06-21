import "server-only";

import { getRun, start } from "workflow/api";

import { SpeechTtsGenerationStatus } from "@/generated/prisma/client";
import { prisma } from "@/prisma";
import { speechTtsWorkflow } from "@/workflows/speech-tts";

export async function cancelSpeechTtsWorkflow(
  workflowRunId: string
): Promise<void> {
  try {
    await getRun(workflowRunId).cancel();
  } catch (error) {
    console.warn(
      `[speech-tts-workflow] cancel failed for ${workflowRunId}`,
      error
    );
  }
}

export async function startSpeechTtsWorkflow(
  speechId: string
): Promise<string> {
  const run = await start(speechTtsWorkflow, [speechId]);

  await prisma.speechTtsGeneration.upsert({
    where: { speechId },
    create: {
      speechId,
      status: SpeechTtsGenerationStatus.processing,
      workflowRunId: run.runId,
      processingStartedAt: new Date(),
      errorMessage: null,
    },
    update: {
      status: SpeechTtsGenerationStatus.processing,
      workflowRunId: run.runId,
      processingStartedAt: new Date(),
      errorMessage: null,
    },
  });

  return run.runId;
}
