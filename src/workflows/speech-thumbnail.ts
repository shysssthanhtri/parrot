import { getWorkflowMetadata } from "workflow";

import {
  finalizeSpeechThumbnailStep,
  generateAndUploadSpeechThumbnailStep,
  markSpeechThumbnailProcessingStep,
} from "@/lib/speech-thumbnail-workflow-steps";

export async function speechThumbnailWorkflow(speechId: string) {
  "use workflow";

  const { workflowRunId } = getWorkflowMetadata();

  await markSpeechThumbnailProcessingStep(speechId);

  try {
    await generateAndUploadSpeechThumbnailStep(speechId);
    await finalizeSpeechThumbnailStep(speechId, workflowRunId, "finished");
  } catch (error) {
    await finalizeSpeechThumbnailStep(speechId, workflowRunId, "failed", error);
  }
}
