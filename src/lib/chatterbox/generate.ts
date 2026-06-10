import "server-only";

import {
  buildSpeechAlignmentFromChunks,
  type SpeechChunkAlignmentInput,
  type SpeechScriptAlignment,
} from "@/lib/speech-script-alignment";
import {
  CHATTERBOX_PROMPT_MAX_CHARS,
  splitTextForTts,
} from "@/lib/speech-text-chunking";
import {
  CHUNK_JOIN_GAP_MS,
  concatWavBuffers,
  getWavDurationMs,
} from "@/lib/wav-concat";

import { createChatterboxClient } from "./client";
import type { components } from "./schema";

export type TTSRequest = components["schemas"]["TTSRequest"];

function formatChatterboxError(status: number, error: unknown): string {
  if (error !== undefined && error !== null) {
    return `Chatterbox TTS request failed (${status}): ${JSON.stringify(error)}`;
  }

  return `Chatterbox TTS request failed (${status})`;
}

export async function generateSpeech(body: TTSRequest): Promise<Buffer> {
  const { data, error, response } = await createChatterboxClient().POST(
    "/generate",
    {
      body,
      parseAs: "arrayBuffer",
    }
  );

  if (!response.ok || error) {
    throw new Error(formatChatterboxError(response.status, error));
  }

  if (!(data instanceof ArrayBuffer) || data.byteLength === 0) {
    throw new Error("Chatterbox TTS returned empty audio");
  }

  return Buffer.from(data);
}

export type LongSpeechResult = {
  audio: Buffer;
  alignment: SpeechScriptAlignment;
};

export async function generateLongSpeech(
  params: Omit<TTSRequest, "prompt"> & { prompt: string }
): Promise<LongSpeechResult> {
  const chunks = splitTextForTts(params.prompt, CHATTERBOX_PROMPT_MAX_CHARS);

  console.info(
    `[chatterbox] TTS prompt: ${params.prompt.length} chars → ${chunks.length} chunk(s)`
  );

  if (chunks.length <= 1) {
    const chunkText = chunks[0] ?? params.prompt.trim();
    const audio = await generateSpeech({
      ...params,
      prompt: chunkText,
    });
    const durationMs = getWavDurationMs(audio);

    return {
      audio,
      alignment: buildSpeechAlignmentFromChunks([
        { text: chunkText, durationMs },
      ]),
    };
  }

  const audioBuffers: Buffer[] = [];
  const chunkMetadata: SpeechChunkAlignmentInput[] = [];

  for (const chunk of chunks) {
    const audio = await generateSpeech({
      ...params,
      prompt: chunk,
    });
    const durationMs = getWavDurationMs(audio);

    chunkMetadata.push({ text: chunk, durationMs });
    audioBuffers.push(audio);
  }

  return {
    audio: concatWavBuffers(audioBuffers, CHUNK_JOIN_GAP_MS),
    alignment: buildSpeechAlignmentFromChunks(chunkMetadata),
  };
}
