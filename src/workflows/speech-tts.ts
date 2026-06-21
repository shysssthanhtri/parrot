import { getWorkflowMetadata } from "workflow";

import {
  BATCH_SIZE,
  failSpeechTtsStep,
  finalizeSpeechTtsStep,
  markSpeechTtsProcessingStep,
  splitAndWarmupSpeechTtsStep,
  synthesizeSpeechTtsBatchStep,
} from "@/lib/speech-tts-workflow-steps";

export async function speechTtsWorkflow(speechId: string) {
  "use workflow";

  const { workflowRunId } = getWorkflowMetadata();

  await markSpeechTtsProcessingStep(speechId, workflowRunId);

  try {
    const { chunkTexts, chunkResults } =
      await splitAndWarmupSpeechTtsStep(speechId);
    const allChunkResults = [...chunkResults];

    for (
      let batchStartIndex = 1;
      batchStartIndex < chunkTexts.length;
      batchStartIndex += BATCH_SIZE
    ) {
      const batchEndIndex = Math.min(
        batchStartIndex + BATCH_SIZE,
        chunkTexts.length
      );
      const batchResults = await synthesizeSpeechTtsBatchStep(
        speechId,
        chunkTexts,
        batchStartIndex,
        batchEndIndex
      );
      allChunkResults.push(...batchResults);
    }

    await finalizeSpeechTtsStep(speechId, workflowRunId, allChunkResults);
  } catch (error) {
    await failSpeechTtsStep(speechId, workflowRunId, error);
  }
}
