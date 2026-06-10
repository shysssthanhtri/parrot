import { handleCallback } from "@vercel/queue";

import type { SpeechTtsStartMessage } from "@/lib/speech-tts-jobs";
import { runSpeechTtsStart } from "@/lib/speech-tts-processing";

export const POST = handleCallback(async (message: SpeechTtsStartMessage) => {
  await runSpeechTtsStart(message.speechId);
});
