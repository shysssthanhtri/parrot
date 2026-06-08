import "server-only";

import {
  CHATTERBOX_PROMPT_MAX_CHARS,
  splitTextForTts,
} from "@/lib/speech-text-chunking";
import { concatWavBuffers } from "@/lib/wav-concat";

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

export async function generateLongSpeech(
  params: Omit<TTSRequest, "prompt"> & { prompt: string }
): Promise<Buffer> {
  const chunks = splitTextForTts(params.prompt, CHATTERBOX_PROMPT_MAX_CHARS);

  console.info(
    `[chatterbox] TTS prompt: ${params.prompt.length} chars → ${chunks.length} chunk(s)`
  );

  if (chunks.length <= 1) {
    return generateSpeech({
      ...params,
      prompt: chunks[0] ?? params.prompt.trim(),
    });
  }

  const audioBuffers: Buffer[] = [];
  for (const chunk of chunks) {
    audioBuffers.push(
      await generateSpeech({
        ...params,
        prompt: chunk,
      })
    );
  }

  return concatWavBuffers(audioBuffers);
}
