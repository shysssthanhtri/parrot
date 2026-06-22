import "server-only";

import { generateThumbnail } from "@/lib/thumbnail/generateThumbnail";
import { prisma } from "@/prisma";

import { buildSpeechThumbnailPrompt } from "./speech-thumbnail-prompt";
import {
  SPEECH_THUMBNAIL_CONTENT_TYPE,
  speechThumbnailObjectKey,
  uploadObject,
} from "./storage";

export {
  buildSpeechThumbnailPrompt,
  SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH,
  truncateForThumbnailPrompt,
} from "./speech-thumbnail-prompt";

export type SpeechThumbnailContext = {
  id: string;
  language: string;
  thumbnailR2ObjectKey: string | null;
  script: {
    title: string;
    content: string;
    topics: {
      name: string;
      color: string;
    }[];
  };
};

export function getUserSafeThumbnailError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Thumbnail generation failed. Please try again.";
}

export async function loadSpeechThumbnailContext(
  speechId: string
): Promise<SpeechThumbnailContext> {
  const speech = await prisma.speech.findUnique({
    where: { id: speechId },
    select: {
      id: true,
      language: true,
      thumbnailR2ObjectKey: true,
      script: {
        select: {
          title: true,
          content: true,
          topics: {
            select: {
              name: true,
              color: true,
            },
          },
        },
      },
    },
  });

  if (!speech) {
    throw new Error(`Speech not found: ${speechId}`);
  }

  return speech;
}

export async function ensureSpeechThumbnailObjectKey(
  speechId: string
): Promise<string> {
  const speech = await prisma.speech.findUnique({
    where: { id: speechId },
    select: { thumbnailR2ObjectKey: true },
  });

  if (!speech) {
    throw new Error(`Speech not found: ${speechId}`);
  }

  if (speech.thumbnailR2ObjectKey) {
    return speech.thumbnailR2ObjectKey;
  }

  const thumbnailR2ObjectKey = speechThumbnailObjectKey(speechId);

  await prisma.speech.update({
    where: { id: speechId },
    data: { thumbnailR2ObjectKey },
  });

  return thumbnailR2ObjectKey;
}

export async function generateAndUploadSpeechThumbnail(
  speech: SpeechThumbnailContext,
  extraPrompt?: string
): Promise<void> {
  const thumbnailR2ObjectKey =
    speech.thumbnailR2ObjectKey ?? speechThumbnailObjectKey(speech.id);

  const prompt = buildSpeechThumbnailPrompt(speech, extraPrompt);
  const webp = await generateThumbnail({ prompt });

  await uploadObject(thumbnailR2ObjectKey, webp, SPEECH_THUMBNAIL_CONTENT_TYPE);
}
