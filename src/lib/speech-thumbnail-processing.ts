import "server-only";

import { getScriptLanguageLabel } from "@/lib/script-languages";
import { generateThumbnail } from "@/lib/thumbnail/generateThumbnail";
import { prisma } from "@/prisma";

import { markSpeechThumbnailFailed } from "./speech-thumbnail-jobs";
import { SPEECH_THUMBNAIL_CONTENT_TYPE, uploadObject } from "./storage";

export const SPEECH_THUMBNAIL_MAX_QUEUE_ATTEMPTS = 3;

const THUMBNAIL_FAILURE_MESSAGE =
  "Thumbnail generation failed. Please try again.";

type SpeechThumbnailContext = {
  id: string;
  language: string;
  thumbnailR2ObjectKey: string;
  thumbnailProcessStatus: string;
  script: {
    title: string;
    topics: {
      name: string;
      color: string;
    }[];
  };
};

export function buildSpeechThumbnailPrompt(speech: SpeechThumbnailContext) {
  const languageLabel = getScriptLanguageLabel(speech.language);
  const topicHint =
    speech.script.topics.length > 0
      ? `Themes: ${speech.script.topics
          .map((topic) => `${topic.name} (${topic.color})`)
          .join(", ")}. `
      : "";

  return [
    `Editorial portrait cover art for a language-learning speech titled "${speech.script.title}".`,
    topicHint,
    `Inspired by ${languageLabel} language learning.`,
    "Soft cinematic lighting, abstract composition, rich color, no text, no letters, no typography, no words.",
  ].join(" ");
}

async function loadSpeechThumbnailContext(
  speechId: string
): Promise<SpeechThumbnailContext> {
  const speech = await prisma.speech.findUnique({
    where: { id: speechId },
    select: {
      id: true,
      language: true,
      thumbnailR2ObjectKey: true,
      thumbnailProcessStatus: true,
      script: {
        select: {
          title: true,
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

  if (!speech.thumbnailR2ObjectKey) {
    throw new Error(`Speech has no thumbnail key: ${speechId}`);
  }

  return {
    ...speech,
    thumbnailR2ObjectKey: speech.thumbnailR2ObjectKey,
  };
}

export async function runSpeechThumbnail(
  speechId: string,
  deliveryCount: number
): Promise<void> {
  const speech = await loadSpeechThumbnailContext(speechId);

  if (speech.thumbnailProcessStatus === "finished") {
    return;
  }

  if (speech.thumbnailProcessStatus === "failed") {
    return;
  }

  if (speech.thumbnailProcessStatus === "pending") {
    await prisma.speech.update({
      where: { id: speechId },
      data: {
        thumbnailProcessStatus: "processing",
        thumbnailErrorMessage: null,
      },
    });
  }

  try {
    const prompt = buildSpeechThumbnailPrompt(speech);
    const webp = await generateThumbnail({ prompt });

    await uploadObject(
      speech.thumbnailR2ObjectKey,
      webp,
      SPEECH_THUMBNAIL_CONTENT_TYPE
    );

    await prisma.speech.update({
      where: { id: speechId },
      data: {
        thumbnailProcessStatus: "finished",
        thumbnailErrorMessage: null,
      },
    });
  } catch (error) {
    console.error(`[speech-thumbnail] ${speechId}`, error);

    if (deliveryCount >= SPEECH_THUMBNAIL_MAX_QUEUE_ATTEMPTS) {
      await markSpeechThumbnailFailed(speechId, THUMBNAIL_FAILURE_MESSAGE);
      return;
    }

    throw error;
  }
}
