export { createChatterboxClient } from "./client";
export {
  generateLongSpeech,
  generateSpeech,
  type LongSpeechResult,
  type TTSRequest,
} from "./generate";
export {
  CHATTERBOX_PROMPT_MAX_CHARS,
  splitTextForTts,
} from "@/lib/speech-text-chunking";
