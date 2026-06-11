import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { z } from "zod";

import {
  DEFAULT_SCRIPT_LANGUAGE,
  SCRIPT_LANGUAGE_CODES,
} from "@/lib/script-languages";
import type { SpeechScriptAlignment } from "@/lib/speech-script-alignment";
import { SPEECH_SLIDERS } from "@/lib/speech-sliders";
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
} as const;

export const speechesRouter = createTRPCRouter({
  list: cmsProcedure.query(async () => {
    return prisma.speech.findMany({
      orderBy: { updatedAt: "desc" },
      include: speechListInclude,
    });
  }),

  getById: cmsProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const speech = await prisma.speech.findUnique({
        where: { id: input.id },
        include: {
          voice: true,
          script: true,
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

      return {
        ...speech,
        alignment: speech.alignment as SpeechScriptAlignment | null,
        audioUrl,
      };
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

      await enqueueSpeechTtsStart(id);

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

      await deleteObjects(speech.chunks.map((chunk) => chunk.tempR2Key));

      await prisma.$transaction(async (tx) => {
        await tx.speechChunk.deleteMany({ where: { speechId: input.id } });
        await tx.speech.update({
          where: { id: input.id },
          data: {
            processStatus: "pending",
            errorMessage: null,
            totalChunks: 0,
            settledChunks: 0,
          },
        });
      });

      await enqueueSpeechTtsStart(input.id);

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

      const storageKeys = [
        speech.r2ObjectKey,
        ...speech.chunks.map((chunk) => chunk.tempR2Key),
      ];

      await deleteObjects(storageKeys);

      await prisma.speech.delete({ where: { id: input.id } });

      return { success: true };
    }),
});
