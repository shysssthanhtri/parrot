import { TRPCError } from "@trpc/server";
import { randomUUID } from "crypto";
import { z } from "zod";

import { generateLongSpeech } from "@/lib/chatterbox/generate";
import {
  DEFAULT_SCRIPT_LANGUAGE,
  SCRIPT_LANGUAGE_CODES,
} from "@/lib/script-languages";
import {
  SPEECH_SLIDERS,
  type SpeechTtsParams,
  toChatterboxTtsParams,
} from "@/lib/speech-sliders";
import {
  getAudioUrl,
  getSpeechUploadUrl,
  objectExists,
  speechObjectKeyForId,
  speechObjectKeyMatchesId,
} from "@/lib/storage";
import { prisma } from "@/prisma";

import { authProcedure, createTRPCRouter } from "../init";

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

const speechGenerationInputSchema = speechTtsParamsSchema.extend({
  voiceId: z.string().min(1, "Voice is required"),
  scriptId: z.string().min(1, "Script is required"),
  language: scriptLanguageSchema.default(DEFAULT_SCRIPT_LANGUAGE),
});

const speechCreateInputSchema = speechGenerationInputSchema.extend({
  id: z.string().uuid(),
  r2ObjectKey: z.string().min(1),
});

type SpeechGenerationInput = z.infer<typeof speechGenerationInputSchema>;

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

async function generateSpeechAudio(
  voice: { r2ObjectKey: string },
  script: { content: string },
  params: SpeechTtsParams
) {
  return generateLongSpeech({
    prompt: script.content,
    voice_key: voice.r2ObjectKey,
    ...toChatterboxTtsParams(params),
  });
}

function toSpeechTtsParams(input: SpeechGenerationInput): SpeechTtsParams {
  return {
    temperature: input.temperature,
    topP: input.topP,
    topK: input.topK,
    repetitionPenalty: input.repetitionPenalty,
    normLoudness: input.normLoudness,
  };
}

export const speechesRouter = createTRPCRouter({
  list: authProcedure.query(async () => {
    return prisma.speech.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        voice: { select: { name: true } },
        script: { select: { title: true } },
      },
    });
  }),

  getById: authProcedure
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

      const audioUrl = await getAudioUrl(speech.r2ObjectKey);

      return { ...speech, audioUrl };
    }),

  getUploadUrl: authProcedure.mutation(async () => {
    const id = randomUUID();
    const r2ObjectKey = speechObjectKeyForId(id);
    const { uploadUrl, method } = await getSpeechUploadUrl(r2ObjectKey);

    return { id, r2ObjectKey, uploadUrl, method };
  }),

  generatePreview: authProcedure
    .input(speechGenerationInputSchema)
    .mutation(async ({ input }) => {
      const { voice, script } = await loadValidatedSpeechInputs(input);
      const audio = await generateSpeechAudio(
        voice,
        script,
        toSpeechTtsParams(input)
      );

      return { audioBase64: audio.toString("base64") };
    }),

  create: authProcedure
    .input(speechCreateInputSchema)
    .mutation(async ({ input, ctx }) => {
      if (!speechObjectKeyMatchesId(input.id, input.r2ObjectKey)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid storage key for speech id",
        });
      }

      await loadValidatedSpeechInputs(input);

      if (!(await objectExists(input.r2ObjectKey))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Speech audio not found in storage",
        });
      }

      return prisma.speech.create({
        data: {
          id: input.id,
          voiceId: input.voiceId,
          scriptId: input.scriptId,
          language: input.language,
          temperature: input.temperature,
          topP: input.topP,
          topK: input.topK,
          repetitionPenalty: input.repetitionPenalty,
          normLoudness: input.normLoudness,
          r2ObjectKey: input.r2ObjectKey,
          userId: ctx.userId,
        },
        include: {
          voice: { select: { name: true } },
          script: { select: { title: true } },
        },
      });
    }),
});
