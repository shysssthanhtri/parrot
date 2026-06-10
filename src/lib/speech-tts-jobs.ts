import "server-only";

import { send } from "@vercel/queue";

import { prisma } from "@/prisma";

import type { SpeechTtsParams } from "./speech-sliders";

export const SPEECH_TTS_TOPICS = {
  start: "speech-tts-start",
  chunk: "speech-tts-chunk",
  finalize: "speech-tts-finalize",
} as const;

export type SpeechTtsStartMessage = {
  speechId: string;
};

export type SpeechTtsChunkMessage = {
  speechId: string;
  chunkIndex: number;
};

export type SpeechTtsFinalizeMessage = {
  speechId: string;
};

export type SpeechTtsInputs = {
  speech: {
    id: string;
    language: string;
    voiceId: string;
    scriptId: string;
    r2ObjectKey: string;
    processStatus: string;
    totalChunks: number;
    settledChunks: number;
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

export async function enqueueSpeechTtsStart(speechId: string) {
  const message: SpeechTtsStartMessage = { speechId };
  await send(SPEECH_TTS_TOPICS.start, message);
}

export async function enqueueSpeechTtsChunk(
  speechId: string,
  chunkIndex: number
) {
  const message: SpeechTtsChunkMessage = { speechId, chunkIndex };
  await send(SPEECH_TTS_TOPICS.chunk, message);
}

export async function enqueueSpeechTtsFinalize(speechId: string) {
  const message: SpeechTtsFinalizeMessage = { speechId };
  await send(SPEECH_TTS_TOPICS.finalize, message, {
    idempotencyKey: `speech-tts-finalize:${speechId}`,
  });
}

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
      processStatus: speech.processStatus,
      totalChunks: speech.totalChunks,
      settledChunks: speech.settledChunks,
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

export function getUserSafeSpeechError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Speech generation failed. Please try again.";
}

export async function markSpeechFailed(
  speechId: string,
  errorMessage: string
): Promise<void> {
  await prisma.speech.update({
    where: { id: speechId },
    data: {
      processStatus: "failed",
      errorMessage,
    },
  });
}

function buildChunkFailureMessage(
  failedCount: number,
  totalCount: number
): string {
  if (failedCount === 1) {
    return "Speech generation failed for one section. Please try again.";
  }

  return `Speech generation failed for ${failedCount} of ${totalCount} sections. Please try again.`;
}

export async function incrementSettledChunks(speechId: string): Promise<{
  totalChunks: number;
  settledChunks: number;
  processStatus: string;
}> {
  return prisma.speech.update({
    where: { id: speechId },
    data: {
      settledChunks: { increment: 1 },
    },
    select: {
      totalChunks: true,
      settledChunks: true,
      processStatus: true,
    },
  });
}

export async function runSettlementGate(speechId: string): Promise<void> {
  const outcome = await prisma.$transaction(async (tx) => {
    const speech = await tx.speech.findUnique({
      where: { id: speechId },
      select: {
        totalChunks: true,
        settledChunks: true,
        processStatus: true,
      },
    });

    if (
      !speech ||
      speech.processStatus !== "processing" ||
      speech.totalChunks === 0 ||
      speech.settledChunks !== speech.totalChunks
    ) {
      return null;
    }

    const chunks = await tx.speechChunk.findMany({
      where: { speechId },
      select: { status: true },
    });

    const failedCount = chunks.filter(
      (chunk) => chunk.status === "failed"
    ).length;

    if (failedCount > 0) {
      await tx.speech.update({
        where: { id: speechId },
        data: {
          processStatus: "failed",
          errorMessage: buildChunkFailureMessage(failedCount, chunks.length),
        },
      });
      return "failed" as const;
    }

    return "finalize" as const;
  });

  if (outcome === "finalize") {
    await enqueueSpeechTtsFinalize(speechId);
  }
}
