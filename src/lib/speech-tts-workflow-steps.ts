import "server-only";

import { SpeechTtsGenerationStatus } from "@/generated/prisma/client";
import {
  finalizeSpeechTtsArtifacts,
  getUserSafeSpeechError,
  loadSpeechTtsInputs,
  type SpeechTtsChunkResult,
  splitSpeechScriptForTts,
  synthesizeSpeechChunk,
} from "@/lib/speech-tts-processing";
import { prisma } from "@/prisma";

const BATCH_SIZE = 10;

export async function markSpeechTtsProcessingStep(
  speechId: string,
  workflowRunId: string
) {
  "use step";

  const generation = await prisma.speechTtsGeneration.findUnique({
    where: { speechId },
    select: { workflowRunId: true },
  });

  if (!generation || generation.workflowRunId !== workflowRunId) {
    console.log(
      `[speech-tts] stale run ${workflowRunId} skipped mark processing for ${speechId}`
    );
    return;
  }

  await prisma.speechTtsGeneration.update({
    where: { speechId },
    data: {
      status: SpeechTtsGenerationStatus.processing,
      processingStartedAt: new Date(),
      errorMessage: null,
    },
  });
}

export async function splitAndWarmupSpeechTtsStep(speechId: string): Promise<{
  chunkTexts: string[];
  chunkResults: SpeechTtsChunkResult[];
}> {
  "use step";

  const { voice, script, ttsParams } = await loadSpeechTtsInputs(speechId);
  const chunkTexts = splitSpeechScriptForTts(script.content);

  console.info(
    `[speech-tts] ${speechId}: ${script.content.length} chars → ${chunkTexts.length} chunk(s)`
  );

  const chunkResults = [
    await synthesizeSpeechChunk(
      speechId,
      0,
      chunkTexts[0],
      voice.r2ObjectKey,
      ttsParams
    ),
  ];

  return { chunkTexts, chunkResults };
}

export async function synthesizeSpeechTtsBatchStep(
  speechId: string,
  chunkTexts: string[],
  batchStartIndex: number,
  batchEndIndex: number
): Promise<SpeechTtsChunkResult[]> {
  "use step";

  const { voice, ttsParams } = await loadSpeechTtsInputs(speechId);
  const batchTexts = chunkTexts.slice(batchStartIndex, batchEndIndex);

  return Promise.all(
    batchTexts.map((text, offset) =>
      synthesizeSpeechChunk(
        speechId,
        batchStartIndex + offset,
        text,
        voice.r2ObjectKey,
        ttsParams
      )
    )
  );
}

export async function finalizeSpeechTtsStep(
  speechId: string,
  workflowRunId: string,
  chunkResults: SpeechTtsChunkResult[]
) {
  "use step";

  const generation = await prisma.speechTtsGeneration.findUnique({
    where: { speechId },
    select: { workflowRunId: true },
  });

  if (!generation || generation.workflowRunId !== workflowRunId) {
    console.log(
      `[speech-tts] stale run ${workflowRunId} skipped finalize for ${speechId}`
    );
    return;
  }

  const { speech } = await loadSpeechTtsInputs(speechId);
  await finalizeSpeechTtsArtifacts(speechId, speech.r2ObjectKey, chunkResults);

  await prisma.speechTtsGeneration.update({
    where: { speechId },
    data: {
      status: SpeechTtsGenerationStatus.finished,
      errorMessage: null,
    },
  });
}

export async function failSpeechTtsStep(
  speechId: string,
  workflowRunId: string,
  error: unknown
) {
  "use step";

  const generation = await prisma.speechTtsGeneration.findUnique({
    where: { speechId },
    select: { workflowRunId: true },
  });

  if (!generation || generation.workflowRunId !== workflowRunId) {
    console.log(
      `[speech-tts] stale run ${workflowRunId} skipped failure for ${speechId}`
    );
    return;
  }

  await prisma.speechTtsGeneration.update({
    where: { speechId },
    data: {
      status: SpeechTtsGenerationStatus.failed,
      errorMessage: getUserSafeSpeechError(error),
    },
  });
}

export { BATCH_SIZE };
