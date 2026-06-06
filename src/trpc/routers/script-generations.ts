import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  generateScriptDraft,
  SCRIPT_GENERATION_LENGTHS,
  SCRIPT_GENERATION_MODEL,
} from "@/lib/script-generation";
import {
  DEFAULT_SCRIPT_LANGUAGE,
  SCRIPT_LANGUAGE_CODES,
} from "@/lib/script-languages";
import { prisma } from "@/prisma";

import { authProcedure, createTRPCRouter } from "../init";

const scriptLanguageSchema = z.enum(SCRIPT_LANGUAGE_CODES, {
  message: "Unsupported language",
});

const generateInputSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(1, "Prompt is required")
    .max(2000, "Prompt is too long"),
  length: z.enum(SCRIPT_GENERATION_LENGTHS, {
    message: "Unsupported length",
  }),
  language: scriptLanguageSchema.default(DEFAULT_SCRIPT_LANGUAGE),
});

function getUserSafeGenerationError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Generation failed";
}

export const scriptGenerationsRouter = createTRPCRouter({
  list: authProcedure.query(async () => {
    return prisma.scriptGeneration.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  generate: authProcedure
    .input(generateInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const draft = await generateScriptDraft(input);

        const generation = await prisma.scriptGeneration.create({
          data: {
            prompt: input.prompt,
            length: input.length,
            language: input.language,
            generatedTitle: draft.title,
            generatedContent: draft.content,
            status: "success",
            model: SCRIPT_GENERATION_MODEL,
            userId: ctx.userId,
          },
        });

        return {
          generationId: generation.id,
          title: draft.title,
          content: draft.content,
        };
      } catch (error) {
        console.error(error);

        await prisma.scriptGeneration.create({
          data: {
            prompt: input.prompt,
            length: input.length,
            language: input.language,
            status: "failed",
            errorMessage: getUserSafeGenerationError(error),
            model: SCRIPT_GENERATION_MODEL,
            userId: ctx.userId,
          },
        });

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate script. Please try again.",
        });
      }
    }),
});
