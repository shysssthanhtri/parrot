import "server-only";

import { TRPCError } from "@trpc/server";

import { SpeechPublicationStatus } from "@/generated/prisma/client";
import {
  type SpeechScriptAlignment,
  speechScriptAlignmentSchema,
} from "@/lib/speech-script-alignment";
import { objectExists } from "@/lib/storage";
import { prisma } from "@/prisma";

export type PublicationStatus = "not_published" | SpeechPublicationStatus;

export type SpeechForPublicationSnapshot = {
  processStatus: string;
  alignment: unknown;
  r2ObjectKey: string;
  language: string;
  script: {
    title: string;
    content: string;
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
  alignment: SpeechScriptAlignment;
  r2ObjectKey: string;
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
  if (speech.processStatus !== "finished") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only finished speeches can be published.",
    });
  }

  if (speech.alignment == null) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Speech alignment is required before publishing.",
    });
  }

  const alignmentResult = speechScriptAlignmentSchema.safeParse(
    speech.alignment
  );

  if (!alignmentResult.success) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Speech alignment is invalid.",
    });
  }

  if (!(await objectExists(speech.r2ObjectKey))) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Final speech audio is missing.",
    });
  }

  return {
    title: speech.script.title,
    content: speech.script.content,
    language: speech.language,
    alignment: alignmentResult.data,
    r2ObjectKey: speech.r2ObjectKey,
    voiceName: speech.voice.name,
    topicIds: speech.script.topics.map((topic) => topic.id),
  };
}
