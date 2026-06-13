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
  enqueueSpeechTtsChunk,
  incrementSettledChunks,
  loadSpeechTtsInputs,
  markSpeechFailed,
  runSettlementGate,
} from "./speech-tts-jobs";
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

export const SPEECH_TTS_MAX_QUEUE_ATTEMPTS = 3;

const START_FAILURE_MESSAGE = "Speech generation failed. Please try again.";
const FINALIZE_FAILURE_MESSAGE =
  "Speech generation failed while assembling audio. Please try again.";

async function synthesizeAndStoreChunk(
  speechId: string,
  chunkIndex: number,
  text: string,
  tempR2Key: string,
  voiceKey: string,
  ttsParams: SpeechTtsParams
): Promise<void> {
  const audio = await generateSpeech({
    prompt: text,
    voice_key: voiceKey,
    ...toChatterboxTtsParams(ttsParams),
  });
  const durationMs = getWavDurationMs(audio);

  await uploadObject(tempR2Key, audio, SPEECH_AUDIO_CONTENT_TYPE);

  await prisma.speechChunk.update({
    where: {
      speechId_chunkIndex: {
        speechId,
        chunkIndex,
      },
    },
    data: {
      status: "done",
      durationMs,
    },
  });
}

async function markChunkFailed(speechId: string, chunkIndex: number) {
  await prisma.speechChunk.updateMany({
    where: {
      speechId,
      chunkIndex,
      status: "pending",
    },
    data: {
      status: "failed",
    },
  });
}

export async function runSpeechTtsStart(speechId: string): Promise<void> {
  const { speech, voice, script, ttsParams } =
    await loadSpeechTtsInputs(speechId);

  if (speech.processStatus !== "pending") {
    return;
  }

  const chunkTexts = splitTextForTts(
    script.content,
    CHATTERBOX_PROMPT_MAX_CHARS
  );

  console.info(
    `[speech-tts-start] ${speechId}: ${script.content.length} chars → ${chunkTexts.length} chunk(s)`
  );

  await prisma.$transaction(async (tx) => {
    await tx.speech.update({
      where: { id: speechId },
      data: {
        processStatus: "processing",
        processingStartedAt: new Date(),
        totalChunks: chunkTexts.length,
        settledChunks: 0,
        errorMessage: null,
      },
    });

    await tx.speechChunk.deleteMany({ where: { speechId } });

    await tx.speechChunk.createMany({
      data: chunkTexts.map((text, chunkIndex) => ({
        speechId,
        chunkIndex,
        text,
        tempR2Key: speechChunkObjectKey(speechId, chunkIndex),
        status: "pending",
      })),
    });
  });

  try {
    await synthesizeAndStoreChunk(
      speechId,
      0,
      chunkTexts[0],
      speechChunkObjectKey(speechId, 0),
      voice.r2ObjectKey,
      ttsParams
    );

    await incrementSettledChunks(speechId);

    if (chunkTexts.length > 1) {
      await Promise.all(
        chunkTexts
          .slice(1)
          .map((_, index) => enqueueSpeechTtsChunk(speechId, index + 1))
      );
    }

    await runSettlementGate(speechId);
  } catch (error) {
    console.error(`[speech-tts-start] ${speechId}`, error);
    await markChunkFailed(speechId, 0);
    await markSpeechFailed(speechId, START_FAILURE_MESSAGE);
  }
}

export async function runSpeechTtsChunk(
  speechId: string,
  chunkIndex: number,
  deliveryCount: number
): Promise<void> {
  const chunk = await prisma.speechChunk.findUnique({
    where: {
      speechId_chunkIndex: {
        speechId,
        chunkIndex,
      },
    },
  });

  if (!chunk) {
    throw new Error(`Speech chunk not found: ${speechId}#${chunkIndex}`);
  }

  if (chunk.status !== "pending") {
    return;
  }

  try {
    const { voice, ttsParams } = await loadSpeechTtsInputs(speechId);

    await synthesizeAndStoreChunk(
      speechId,
      chunkIndex,
      chunk.text,
      chunk.tempR2Key,
      voice.r2ObjectKey,
      ttsParams
    );
  } catch (error) {
    console.error(`[speech-tts-chunk] ${speechId}#${chunkIndex}`, error);

    if (deliveryCount >= SPEECH_TTS_MAX_QUEUE_ATTEMPTS) {
      await markChunkFailed(speechId, chunkIndex);
      await incrementSettledChunks(speechId);
      await runSettlementGate(speechId);
      return;
    }

    throw error;
  }

  await incrementSettledChunks(speechId);
  await runSettlementGate(speechId);
}

function assembleSpeechFromChunkAudio(
  audioBuffers: Buffer[],
  chunks: SpeechChunkAlignmentInput[]
) {
  return {
    audio: concatWavBuffers(audioBuffers, CHUNK_JOIN_GAP_MS),
    alignment: buildSpeechAlignmentFromChunks(chunks),
  };
}

export async function runSpeechTtsFinalize(
  speechId: string,
  deliveryCount: number
): Promise<void> {
  const speech = await prisma.speech.findUnique({
    where: { id: speechId },
    select: {
      processStatus: true,
      r2ObjectKey: true,
    },
  });

  if (!speech) {
    return;
  }

  if (speech.processStatus === "finished") {
    return;
  }

  try {
    const chunks = await prisma.speechChunk.findMany({
      where: { speechId },
      orderBy: { chunkIndex: "asc" },
    });

    if (
      chunks.length === 0 ||
      chunks.some((chunk) => chunk.status !== "done")
    ) {
      throw new Error("Finalize requires all chunks to be done");
    }

    const audioBuffers: Buffer[] = [];
    const alignmentInputs: SpeechChunkAlignmentInput[] = [];

    for (const chunk of chunks) {
      const storedObject = await readObject(chunk.tempR2Key);

      if (!storedObject) {
        throw new Error(`Missing chunk audio: ${chunk.tempR2Key}`);
      }

      if (chunk.durationMs === null) {
        throw new Error(`Missing chunk duration: ${chunk.tempR2Key}`);
      }

      audioBuffers.push(storedObject.body);
      alignmentInputs.push({
        text: chunk.text,
        durationMs: chunk.durationMs,
      });
    }

    const { audio, alignment } = assembleSpeechFromChunkAudio(
      audioBuffers,
      alignmentInputs
    );

    await uploadObject(speech.r2ObjectKey, audio, SPEECH_AUDIO_CONTENT_TYPE);

    await prisma.speech.update({
      where: { id: speechId },
      data: {
        alignment,
        processStatus: "finished",
        errorMessage: null,
      },
    });

    await deleteObjects(chunks.map((chunk) => chunk.tempR2Key));
  } catch (error) {
    console.error(`[speech-tts-finalize] ${speechId}`, error);

    if (deliveryCount >= SPEECH_TTS_MAX_QUEUE_ATTEMPTS) {
      await markSpeechFailed(speechId, FINALIZE_FAILURE_MESSAGE);
      return;
    }

    throw error;
  }
}
