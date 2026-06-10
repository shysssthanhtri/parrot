import { handleCallback } from "@vercel/queue";

import type { SpeechTtsChunkMessage } from "@/lib/speech-tts-jobs";
import { runSpeechTtsChunk } from "@/lib/speech-tts-processing";

export const POST = handleCallback(
  async (message: SpeechTtsChunkMessage, metadata) => {
    await runSpeechTtsChunk(
      message.speechId,
      message.chunkIndex,
      metadata.deliveryCount
    );
  }
);
