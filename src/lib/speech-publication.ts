import "server-only";

import { TRPCError } from "@trpc/server";

import { SpeechPublicationStatus } from "@/generated/prisma/client";
import { assertSpeechReadyToPublish } from "@/lib/speech-publish-readiness";
import {
  type SpeechScriptAlignment,
  speechScriptAlignmentSchema,
} from "@/lib/speech-script-alignment";
import { prisma } from "@/prisma";

export type PublicationStatus = "not_published" | SpeechPublicationStatus;

export type SpeechForPublicationSnapshot = {
  processStatus: string;
  alignment: unknown;
  r2ObjectKey: string;
  thumbnailProcessStatus: string;
  thumbnailR2ObjectKey: string | null;
  language: string;
  script: {
    title: string;
    content: string;
    length: string;
    topics: { id: string }[];
  };
  voice: {
    name: string;
  };
};

export type PublicationSnapshot = {
  title: string;
  content: string;
  language: string;
  length: string;
  alignment: SpeechScriptAlignment;
  r2ObjectKey: string;
  thumbnailR2ObjectKey: string;
  voiceName: string;
  topicIds: string[];
};

export async function getPublicationStatus(
  speechId: string
): Promise<PublicationStatus> {
  const publication = await prisma.speechPublication.findUnique({
    where: { speechId },
    select: { status: true },
  });

  if (!publication) {
    return "not_published";
  }

  return publication.status;
}

export async function assertSpeechNotPublished(speechId: string) {
  const status = await getPublicationStatus(speechId);

  if (status === SpeechPublicationStatus.published) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Unpublish this speech before regenerating or deleting it.",
    });
  }
}

export async function buildPublicationSnapshot(
  speech: SpeechForPublicationSnapshot
): Promise<PublicationSnapshot> {
  await assertSpeechReadyToPublish(speech);

  const alignmentResult = speechScriptAlignmentSchema.safeParse(
    speech.alignment
  );

  if (!alignmentResult.success || !speech.thumbnailR2ObjectKey) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Speech is not ready to publish.",
    });
  }

  return {
    title: speech.script.title,
    content: speech.script.content,
    language: speech.language,
    length: speech.script.length,
    alignment: alignmentResult.data,
    r2ObjectKey: speech.r2ObjectKey,
    thumbnailR2ObjectKey: speech.thumbnailR2ObjectKey,
    voiceName: speech.voice.name,
    topicIds: speech.script.topics.map((topic) => topic.id),
  };
}
