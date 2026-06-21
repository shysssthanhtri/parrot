import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { SCRIPT_GENERATION_LENGTHS } from "@/lib/script-generation-prompt";
import {
  DEFAULT_SCRIPT_LANGUAGE,
  SCRIPT_LANGUAGE_CODES,
} from "@/lib/script-languages";
import { deleteObjects, deleteSpeechChunkObjects } from "@/lib/storage";
import { prisma } from "@/prisma";

import { cmsProcedure, createTRPCRouter } from "../init";

const scriptLanguageSchema = z.enum(SCRIPT_LANGUAGE_CODES, {
  message: "Unsupported language",
});

const scriptLengthSchema = z.enum(SCRIPT_GENERATION_LENGTHS, {
  message: "Unsupported length",
});

const scriptFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
  length: scriptLengthSchema,
  language: scriptLanguageSchema.default(DEFAULT_SCRIPT_LANGUAGE),
});

const scriptCreateSchema = scriptFieldsSchema.extend({
  generationId: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
});

async function getValidGenerationForLink(generationId: string, userId: string) {
  const generation = await prisma.scriptGeneration.findUnique({
    where: { id: generationId },
  });

  if (
    !generation ||
    generation.userId !== userId ||
    generation.status !== "success" ||
    generation.scriptId !== null
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid generation link",
    });
  }

  return generation;
}

export const scriptsRouter = createTRPCRouter({
  list: cmsProcedure.query(async () => {
    return prisma.script.findMany({
      orderBy: { updatedAt: "desc" },
      include: { topics: true },
    });
  }),

  getById: cmsProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const script = await prisma.script.findUnique({
        where: { id: input.id },
        include: {
          topics: true,
          _count: { select: { speeches: true } },
        },
      });

      if (!script) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Script not found: ${input.id}`,
        });
      }

      return script;
    }),

  create: cmsProcedure
    .input(scriptCreateSchema)
    .mutation(async ({ input, ctx }) => {
      const { generationId, topicIds, ...fields } = input;

      const generation = generationId
        ? await getValidGenerationForLink(generationId, ctx.userId)
        : null;

      const length = generation
        ? scriptLengthSchema.parse(generation.length)
        : fields.length;

      return prisma.$transaction(async (tx) => {
        const script = await tx.script.create({
          data: {
            title: fields.title,
            content: fields.content,
            contentLength: fields.content.length,
            length,
            language: fields.language,
            userId: ctx.userId,
            ...(topicIds?.length && {
              topics: {
                connect: topicIds.map((id) => ({ id })),
              },
            }),
          },
          include: { topics: true },
        });

        if (generationId) {
          await tx.scriptGeneration.update({
            where: { id: generationId },
            data: { scriptId: script.id },
          });
        }

        return script;
      });
    }),

  update: cmsProcedure
    .input(
      scriptFieldsSchema.extend({
        id: z.string(),
        topicIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { topicIds, ...fields } = input;

      const existing = await prisma.script.findUnique({
        where: { id: fields.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Script not found: ${fields.id}`,
        });
      }

      return prisma.script.update({
        where: { id: fields.id },
        data: {
          title: fields.title,
          content: fields.content,
          contentLength: fields.content.length,
          length: fields.length,
          language: fields.language,
          ...(topicIds !== undefined && {
            topics: {
              set: topicIds.map((id) => ({ id })),
            },
          }),
        },
        include: { topics: true },
      });
    }),

  delete: cmsProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const script = await prisma.script.findUnique({
        where: { id: input.id },
        include: {
          speeches: {
            select: {
              id: true,
              r2ObjectKey: true,
              thumbnailR2ObjectKey: true,
            },
          },
        },
      });

      if (!script) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Script not found: ${input.id}`,
        });
      }

      await Promise.all(
        script.speeches.map((speech) => deleteSpeechChunkObjects(speech.id))
      );

      const storageKeys = script.speeches.flatMap((speech) => [
        speech.r2ObjectKey,
        ...(speech.thumbnailR2ObjectKey ? [speech.thumbnailR2ObjectKey] : []),
      ]);

      if (storageKeys.length > 0) {
        await deleteObjects(storageKeys);
      }

      await prisma.$transaction(async (tx) => {
        if (script.speeches.length > 0) {
          await tx.speech.deleteMany({ where: { scriptId: input.id } });
        }

        await tx.script.delete({ where: { id: input.id } });
      });

      return { success: true };
    }),
});
