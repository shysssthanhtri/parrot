import { handleCallback } from "@vercel/queue";

import type { SpeechTtsFinalizeMessage } from "@/lib/speech-tts-jobs";
import { runSpeechTtsFinalize } from "@/lib/speech-tts-processing";

export const POST = handleCallback(
  async (message: SpeechTtsFinalizeMessage, metadata) => {
    await runSpeechTtsFinalize(message.speechId, metadata.deliveryCount);
  }
);
