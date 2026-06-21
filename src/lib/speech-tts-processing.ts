import "server-only";

import { generateSpeech } from "@/lib/chatterbox/generate";
import { prisma } from "@/prisma";

import {
  buildSpeechAlignmentFromChunks,
  type SpeechChunkAlignmentInput,
} from "./speech-script-alignment";
import { type SpeechTtsParams, toChatterboxTtsParams } from "./speech-sliders";
import {
  CHATTERBOX_PROMPT_MAX_CHARS,
  splitTextForTts,
} from "./speech-text-chunking";
import {
  deleteObjects,
  readObject,
  SPEECH_AUDIO_CONTENT_TYPE,
  speechChunkObjectKey,
  uploadObject,
} from "./storage";
import {
  CHUNK_JOIN_GAP_MS,
  concatWavBuffers,
  getWavDurationMs,
} from "./wav-concat";

const START_FAILURE_MESSAGE = "Speech generation failed. Please try again.";
const FINALIZE_FAILURE_MESSAGE =
  "Speech generation failed while assembling audio. Please try again.";

export type SpeechTtsInputs = {
  speech: {
    id: string;
    language: string;
    voiceId: string;
    scriptId: string;
    r2ObjectKey: string;
    temperature: number;
    topP: number;
    topK: number;
    repetitionPenalty: number;
    normLoudness: boolean;
  };
  voice: {
    id: string;
    r2ObjectKey: string;
    language: string;
  };
  script: {
    id: string;
    content: string;
    language: string;
  };
  ttsParams: SpeechTtsParams;
};

export type SpeechTtsChunkResult = {
  chunkIndex: number;
  text: string;
  durationMs: number;
  tempR2Key: string;
};

export async function loadSpeechTtsInputs(
  speechId: string
): Promise<SpeechTtsInputs> {
  const speech = await prisma.speech.findUnique({
    where: { id: speechId },
    include: {
      voice: true,
      script: true,
    },
  });

  if (!speech) {
    throw new Error(`Speech not found: ${speechId}`);
  }

  if (!speech.voice.r2ObjectKey) {
    throw new Error(`Voice has no audio sample: ${speech.voiceId}`);
  }

  if (speech.voice.language !== speech.language) {
    throw new Error("Voice language does not match speech language");
  }

  if (speech.script.language !== speech.language) {
    throw new Error("Script language does not match speech language");
  }

  return {
    speech: {
      id: speech.id,
      language: speech.language,
      voiceId: speech.voiceId,
      scriptId: speech.scriptId,
      r2ObjectKey: speech.r2ObjectKey,
      temperature: speech.temperature,
      topP: speech.topP,
      topK: speech.topK,
      repetitionPenalty: speech.repetitionPenalty,
      normLoudness: speech.normLoudness,
    },
    voice: {
      id: speech.voice.id,
      r2ObjectKey: speech.voice.r2ObjectKey,
      language: speech.voice.language,
    },
    script: {
      id: speech.script.id,
      content: speech.script.content,
      language: speech.script.language,
    },
    ttsParams: {
      temperature: speech.temperature,
      topP: speech.topP,
      topK: speech.topK,
      repetitionPenalty: speech.repetitionPenalty,
      normLoudness: speech.normLoudness,
    },
  };
}

export function splitSpeechScriptForTts(scriptContent: string) {
  return splitTextForTts(scriptContent, CHATTERBOX_PROMPT_MAX_CHARS);
}

export function getUserSafeSpeechError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return START_FAILURE_MESSAGE;
}

export async function synthesizeSpeechChunk(
  speechId: string,
  chunkIndex: number,
  text: string,
  voiceKey: string,
  ttsParams: SpeechTtsParams
): Promise<SpeechTtsChunkResult> {
  const tempR2Key = speechChunkObjectKey(speechId, chunkIndex);
  const audio = await generateSpeech({
    prompt: text,
    voice_key: voiceKey,
    ...toChatterboxTtsParams(ttsParams),
  });
  const durationMs = getWavDurationMs(audio);

  await uploadObject(tempR2Key, audio, SPEECH_AUDIO_CONTENT_TYPE);

  return {
    chunkIndex,
    text,
    durationMs,
    tempR2Key,
  };
}

export function assembleSpeechFromChunkResults(
  chunkResults: SpeechTtsChunkResult[]
) {
  const sorted = [...chunkResults].sort(
    (left, right) => left.chunkIndex - right.chunkIndex
  );
  const alignmentInputs: SpeechChunkAlignmentInput[] = sorted.map((chunk) => ({
    text: chunk.text,
    durationMs: chunk.durationMs,
  }));

  return {
    alignment: buildSpeechAlignmentFromChunks(alignmentInputs),
    tempR2Keys: sorted.map((chunk) => chunk.tempR2Key),
  };
}

export async function finalizeSpeechTtsArtifacts(
  speechId: string,
  r2ObjectKey: string,
  chunkResults: SpeechTtsChunkResult[]
) {
  const sorted = [...chunkResults].sort(
    (left, right) => left.chunkIndex - right.chunkIndex
  );
  const audioBuffers: Buffer[] = [];

  for (const chunk of sorted) {
    const storedObject = await readObject(chunk.tempR2Key);

    if (!storedObject) {
      throw new Error(`Missing chunk audio: ${chunk.tempR2Key}`);
    }

    audioBuffers.push(storedObject.body);
  }

  const { alignment, tempR2Keys } = assembleSpeechFromChunkResults(sorted);
  const audio = concatWavBuffers(audioBuffers, CHUNK_JOIN_GAP_MS);

  await uploadObject(r2ObjectKey, audio, SPEECH_AUDIO_CONTENT_TYPE);

  await prisma.speech.update({
    where: { id: speechId },
    data: {
      alignment,
    },
  });

  await deleteObjects(tempR2Keys);
}

export { FINALIZE_FAILURE_MESSAGE, START_FAILURE_MESSAGE };
