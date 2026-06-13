import "server-only";

import { send } from "@vercel/queue";

import { prisma } from "@/prisma";

export const SPEECH_THUMBNAIL_TOPIC = "speech-thumbnail";

export type SpeechThumbnailMessage = {
  speechId: string;
};

export async function enqueueSpeechThumbnail(speechId: string) {
  const message: SpeechThumbnailMessage = { speechId };
  await send(SPEECH_THUMBNAIL_TOPIC, message);
}

export function getUserSafeThumbnailError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Thumbnail generation failed. Please try again.";
}

export async function markSpeechThumbnailFailed(
  speechId: string,
  errorMessage: string
): Promise<void> {
  await prisma.speech.update({
    where: { id: speechId },
    data: {
      thumbnailProcessStatus: "failed",
      thumbnailErrorMessage: errorMessage,
    },
  });
}
