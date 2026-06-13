import { handleCallback } from "@vercel/queue";

import type { SpeechThumbnailMessage } from "@/lib/speech-thumbnail-jobs";
import { runSpeechThumbnail } from "@/lib/speech-thumbnail-processing";

export const runtime = "nodejs";

export const POST = handleCallback(
  async (message: SpeechThumbnailMessage, metadata) => {
    await runSpeechThumbnail(message.speechId, metadata.deliveryCount);
  }
);
