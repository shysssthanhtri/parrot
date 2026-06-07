import "server-only";

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
