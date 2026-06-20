import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { z } from "zod";

import { SpeechPublicationStatus } from "@/generated/prisma/client";
import {
  DEFAULT_SCRIPT_LANGUAGE,
  SCRIPT_LANGUAGE_CODES,
} from "@/lib/script-languages";
import { assertSpeechNotPublished } from "@/lib/speech-publication";
import { getPublishReadinessIssues } from "@/lib/speech-publish-readiness";
import {
  assertSpeechCanRegenerate,
  canRegenerateSpeech,
  resetSpeechForTtsRestart,
} from "@/lib/speech-regenerate";
import type { SpeechScriptAlignment } from "@/lib/speech-script-alignment";
import { SPEECH_SLIDERS } from "@/lib/speech-sliders";
import {
  cancelSpeechThumbnailWorkflow,
  startSpeechThumbnailWorkflow,
} from "@/lib/speech-thumbnail-workflow";
import { enqueueSpeechTtsStart } from "@/lib/speech-tts-jobs";
import {
  deleteObjects,
  getAudioUrl,
  objectExists,
  speechObjectKeyForId,
} from "@/lib/storage";
import { prisma } from "@/prisma";

import { cmsProcedure, createTRPCRouter } from "../init";

const scriptLanguageSchema = z.enum(SCRIPT_LANGUAGE_CODES, {
  message: "Unsupported language",
});

const speechTtsParamsSchema = z.object({
  temperature: z.number().min(SPEECH_SLIDERS[0].min).max(SPEECH_SLIDERS[0].max),
  topP: z.number().min(SPEECH_SLIDERS[1].min).max(SPEECH_SLIDERS[1].max),
  topK: z.number().int().min(SPEECH_SLIDERS[2].min).max(SPEECH_SLIDERS[2].max),
  repetitionPenalty: z
    .number()
    .min(SPEECH_SLIDERS[3].min)
    .max(SPEECH_SLIDERS[3].max),
  normLoudness: z.boolean(),
});

const speechCreateInputSchema = speechTtsParamsSchema.extend({
  voiceId: z.string().min(1, "Voice is required"),
  scriptId: z.string().min(1, "Script is required"),
  language: scriptLanguageSchema.default(DEFAULT_SCRIPT_LANGUAGE),
});

async function loadValidatedSpeechInputs(input: {
  voiceId: string;
  scriptId: string;
  language: string;
}) {
  const [voice, script] = await Promise.all([
    prisma.voice.findUnique({ where: { id: input.voiceId } }),
    prisma.script.findUnique({ where: { id: input.scriptId } }),
  ]);

  if (!voice) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Voice not found: ${input.voiceId}`,
    });
  }

  if (!script) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Script not found: ${input.scriptId}`,
    });
  }

  if (!voice.r2ObjectKey) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Voice has no audio sample",
    });
  }

  if (voice.language !== input.language) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Voice language does not match selected language",
    });
  }

  if (script.language !== input.language) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Script language does not match selected language",
    });
  }

  return { voice: { ...voice, r2ObjectKey: voice.r2ObjectKey }, script };
}

const speechListInclude = {
  voice: { select: { name: true } },
  script: { select: { title: true } },
  publication: { select: { status: true, publishedAt: true } },
} as const;

function toPublicationSummary(
  publication: {
    status: SpeechPublicationStatus;
    publishedAt: Date | null;
  } | null
) {
  return publication
    ? {
        status: publication.status,
        publishedAt: publication.publishedAt,
      }
    : { status: "not_published" as const };
}

export const speechesRouter = createTRPCRouter({
  list: cmsProcedure.query(async () => {
    const speeches = await prisma.speech.findMany({
      orderBy: { updatedAt: "desc" },
      include: speechListInclude,
    });

    return speeches.map(({ publication, ...speech }) => ({
      ...speech,
      publication: toPublicationSummary(publication),
    }));
  }),

  getById: cmsProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const speech = await prisma.speech.findUnique({
        where: { id: input.id },
        include: {
          voice: true,
          script: true,
          publication: { select: { status: true, publishedAt: true } },
          thumbnailGeneration: {
            select: { status: true, errorMessage: true },
          },
        },
      });

      if (!speech) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Speech not found: ${input.id}`,
        });
      }

      const audioUrl =
        speech.processStatus === "finished" &&
        (await objectExists(speech.r2ObjectKey))
          ? await getAudioUrl(speech.r2ObjectKey)
          : null;

      const thumbnailUrl =
        speech.thumbnailGeneration?.status === "finished" &&
        speech.thumbnailR2ObjectKey &&
        (await objectExists(speech.thumbnailR2ObjectKey))
          ? await getAudioUrl(speech.thumbnailR2ObjectKey)
          : null;

      const publication = toPublicationSummary(speech.publication);

      const isPublished =
        publication.status === SpeechPublicationStatus.published;

      return {
        ...speech,
        publication,
        alignment: speech.alignment as SpeechScriptAlignment | null,
        audioUrl,
        thumbnailUrl,
        canRegenerate: canRegenerateSpeech(speech) && !isPublished,
      };
    }),

  getPublishReadiness: cmsProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const speech = await prisma.speech.findUnique({
        where: { id: input.id },
        select: {
          processStatus: true,
          alignment: true,
          r2ObjectKey: true,
          thumbnailR2ObjectKey: true,
          thumbnailGeneration: { select: { status: true } },
        },
      });

      if (!speech) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Speech not found: ${input.id}`,
        });
      }

      const issues = await getPublishReadinessIssues(speech);

      return { issues };
    }),

  create: cmsProcedure
    .input(speechCreateInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { script } = await loadValidatedSpeechInputs(input);
      const id = randomUUID();
      const r2ObjectKey = speechObjectKeyForId(id);

      const speech = await prisma.speech.create({
        data: {
          id,
          voiceId: input.voiceId,
          scriptId: input.scriptId,
          contentLength: script.content.length,
          language: input.language,
          temperature: input.temperature,
          topP: input.topP,
          topK: input.topK,
          repetitionPenalty: input.repetitionPenalty,
          normLoudness: input.normLoudness,
          r2ObjectKey,
          processStatus: "pending",
          userId: ctx.userId,
        },
        include: speechListInclude,
      });

      await Promise.all([
        enqueueSpeechTtsStart(id),
        startSpeechThumbnailWorkflow(id),
      ]);

      return speech;
    }),

  retry: cmsProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const speech = await prisma.speech.findUnique({
        where: { id: input.id },
        include: { chunks: true },
      });

      if (!speech) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Speech not found: ${input.id}`,
        });
      }

      if (speech.processStatus !== "failed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only failed speeches can be retried",
        });
      }

      await resetSpeechForTtsRestart({
        speechId: input.id,
        chunks: speech.chunks,
        r2ObjectKey: speech.r2ObjectKey,
        deleteFinalWav: false,
        clearAlignment: false,
      });

      await enqueueSpeechTtsStart(input.id);

      return prisma.speech.findUniqueOrThrow({
        where: { id: input.id },
        include: speechListInclude,
      });
    }),

  regenerate: cmsProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const speech = await prisma.speech.findUnique({
        where: { id: input.id },
        include: { chunks: true },
      });

      if (!speech) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Speech not found: ${input.id}`,
        });
      }

      assertSpeechCanRegenerate(speech);
      await assertSpeechNotPublished(input.id);

      await resetSpeechForTtsRestart({
        speechId: input.id,
        chunks: speech.chunks,
        r2ObjectKey: speech.r2ObjectKey,
        deleteFinalWav: true,
        clearAlignment: true,
      });

      await enqueueSpeechTtsStart(input.id);

      return prisma.speech.findUniqueOrThrow({
        where: { id: input.id },
        include: speechListInclude,
      });
    }),

  regenerateThumbnail: cmsProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const speech = await prisma.speech.findUnique({
        where: { id: input.id },
        select: {
          thumbnailR2ObjectKey: true,
          thumbnailGeneration: {
            select: { status: true, workflowRunId: true },
          },
        },
      });

      if (!speech) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Speech not found: ${input.id}`,
        });
      }

      await assertSpeechNotPublished(input.id);

      const generation = speech.thumbnailGeneration;

      if (generation?.status === "processing" && generation.workflowRunId) {
        await cancelSpeechThumbnailWorkflow(generation.workflowRunId);
      }

      if (speech.thumbnailR2ObjectKey) {
        await deleteObjects([speech.thumbnailR2ObjectKey]);
      }

      await prisma.speech.update({
        where: { id: input.id },
        data: { thumbnailR2ObjectKey: null },
      });

      await startSpeechThumbnailWorkflow(input.id);

      return prisma.speech.findUniqueOrThrow({
        where: { id: input.id },
        include: speechListInclude,
      });
    }),

  delete: cmsProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const speech = await prisma.speech.findUnique({
        where: { id: input.id },
        include: { chunks: true },
      });

      if (!speech) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Speech not found: ${input.id}`,
        });
      }

      await assertSpeechNotPublished(input.id);

      const storageKeys = [
        speech.r2ObjectKey,
        ...(speech.thumbnailR2ObjectKey ? [speech.thumbnailR2ObjectKey] : []),
        ...speech.chunks.map((chunk) => chunk.tempR2Key),
      ];

      await deleteObjects(storageKeys);

      await prisma.speech.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
