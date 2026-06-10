import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  DEFAULT_SCRIPT_LANGUAGE,
  SCRIPT_LANGUAGE_CODES,
} from "@/lib/script-languages";
import { prisma } from "@/prisma";

import { cmsProcedure, createTRPCRouter } from "../init";

const scriptLanguageSchema = z.enum(SCRIPT_LANGUAGE_CODES, {
  message: "Unsupported language",
});

const scriptFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
  language: scriptLanguageSchema.default(DEFAULT_SCRIPT_LANGUAGE),
});

const scriptCreateSchema = scriptFieldsSchema.extend({
  generationId: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
});

async function assertValidGenerationLink(generationId: string, userId: string) {
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
        include: { topics: true },
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

      if (generationId) {
        await assertValidGenerationLink(generationId, ctx.userId);
      }

      return prisma.$transaction(async (tx) => {
        const script = await tx.script.create({
          data: {
            title: fields.title,
            content: fields.content,
            contentLength: fields.content.length,
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
});
