import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { Prisma, SpeechPublicationStatus } from "@/generated/prisma/client";
import { SCRIPT_LANGUAGE_CODES } from "@/lib/script-languages";
import { buildPublicationSnapshot } from "@/lib/speech-publication";
import { assertSpeechCanRegenerate } from "@/lib/speech-regenerate";
import type { SpeechScriptAlignment } from "@/lib/speech-script-alignment";
import { enqueueSpeechTtsStart } from "@/lib/speech-tts-jobs";
import { deleteObjects, getAudioUrl, objectExists } from "@/lib/storage";
import { prisma } from "@/prisma";

import { authProcedure, cmsProcedure, createTRPCRouter } from "../init";

const scriptLanguageSchema = z.enum(SCRIPT_LANGUAGE_CODES, {
  message: "Unsupported language",
});

const speechIdInputSchema = z.object({
  id: z.string().min(1),
});

const speechForPublishInclude = {
  script: {
    include: {
      topics: { select: { id: true } },
    },
  },
  voice: { select: { name: true } },
} as const;

async function loadSpeechForPublish(speechId: string) {
  const speech = await prisma.speech.findUnique({
    where: { id: speechId },
    include: speechForPublishInclude,
  });

  if (!speech) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Speech not found: ${speechId}`,
    });
  }

  return speech;
}

export const speechPublicationsRouter = createTRPCRouter({
  getBySpeechId: cmsProcedure
    .input(speechIdInputSchema)
    .query(async ({ input }) => {
      const publication = await prisma.speechPublication.findUnique({
        where: { speechId: input.id },
      });

      if (!publication) {
        return { status: "not_published" as const };
      }

      return {
        ...publication,
        alignment: publication.alignment as SpeechScriptAlignment,
      };
    }),

  publish: cmsProcedure
    .input(speechIdInputSchema)
    .mutation(async ({ input }) => {
      const speech = await loadSpeechForPublish(input.id);
      const snapshot = await buildPublicationSnapshot(speech);
      const publishedAt = new Date();

      return prisma.speechPublication.upsert({
        where: { speechId: input.id },
        create: {
          speechId: input.id,
          status: SpeechPublicationStatus.published,
          publishedAt,
          ...snapshot,
          alignment: snapshot.alignment,
        },
        update: {
          status: SpeechPublicationStatus.published,
          publishedAt,
          ...snapshot,
          alignment: snapshot.alignment,
        },
      });
    }),

  unpublish: cmsProcedure
    .input(speechIdInputSchema)
    .mutation(async ({ input }) => {
      const publication = await prisma.speechPublication.findUnique({
        where: { speechId: input.id },
      });

      if (
        !publication ||
        publication.status !== SpeechPublicationStatus.published
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only published speeches can be unpublished.",
        });
      }

      return prisma.speechPublication.update({
        where: { speechId: input.id },
        data: { status: SpeechPublicationStatus.unpublished },
      });
    }),

  unpublishAndRegenerate: cmsProcedure
    .input(speechIdInputSchema)
    .mutation(async ({ input }) => {
      const speech = await prisma.speech.findUnique({
        where: { id: input.id },
        include: {
          chunks: true,
          publication: true,
        },
      });

      if (!speech) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Speech not found: ${input.id}`,
        });
      }

      if (
        !speech.publication ||
        speech.publication.status !== SpeechPublicationStatus.published
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Only published speeches can be unpublished and regenerated.",
        });
      }

      assertSpeechCanRegenerate(speech);

      const storageKeys = [
        ...speech.chunks.map((chunk) => chunk.tempR2Key),
        speech.r2ObjectKey,
      ];

      if (storageKeys.length > 0) {
        await deleteObjects(storageKeys);
      }

      await prisma.$transaction(async (tx) => {
        await tx.speechPublication.update({
          where: { speechId: input.id },
          data: { status: SpeechPublicationStatus.unpublished },
        });
        await tx.speechChunk.deleteMany({ where: { speechId: input.id } });
        await tx.speech.update({
          where: { id: input.id },
          data: {
            processStatus: "pending",
            errorMessage: null,
            totalChunks: 0,
            settledChunks: 0,
            processingStartedAt: null,
            alignment: Prisma.DbNull,
          },
        });
      });

      await enqueueSpeechTtsStart(input.id);

      return prisma.speech.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          voice: { select: { name: true } },
          script: { select: { title: true } },
        },
      });
    }),

  list: authProcedure
    .input(
      z.object({
        language: scriptLanguageSchema.optional(),
        topicId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      return prisma.speechPublication.findMany({
        where: {
          status: SpeechPublicationStatus.published,
          ...(input.language ? { language: input.language } : {}),
          ...(input.topicId ? { topicIds: { has: input.topicId } } : {}),
        },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          language: true,
          voiceName: true,
          publishedAt: true,
          topicIds: true,
        },
      });
    }),

  getById: authProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const publication = await prisma.speechPublication.findUnique({
        where: { id: input.id },
      });

      if (
        !publication ||
        publication.status !== SpeechPublicationStatus.published
      ) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Published speech not found: ${input.id}`,
        });
      }

      const audioUrl = (await objectExists(publication.r2ObjectKey))
        ? await getAudioUrl(publication.r2ObjectKey)
        : null;

      return {
        ...publication,
        alignment: publication.alignment as SpeechScriptAlignment,
        audioUrl,
      };
    }),
});
