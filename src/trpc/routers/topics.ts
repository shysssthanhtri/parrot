import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { generateText } from "@/lib/llm";
import { prisma } from "@/prisma";

import { cmsProcedure, createTRPCRouter } from "../init";

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color format");

const topicCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  color: hexColorSchema.optional(),
});

const topicUpdateSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name is required").optional(),
  description: z.string().trim().optional(),
  color: hexColorSchema.optional(),
});

export const topicsRouter = createTRPCRouter({
  list: cmsProcedure.query(async ({ ctx }) => {
    return prisma.topic.findMany({
      where: { userId: ctx.userId },
      orderBy: { name: "asc" },
    });
  }),

  getById: cmsProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const topic = await prisma.topic.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!topic) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Topic not found: ${input.id}`,
        });
      }

      return topic;
    }),

  create: cmsProcedure
    .input(topicCreateSchema)
    .mutation(async ({ input, ctx }) => {
      return prisma.topic.create({
        data: {
          name: input.name,
          description: input.description,
          color: input.color,
          userId: ctx.userId,
        },
      });
    }),

  update: cmsProcedure
    .input(topicUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.topic.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Topic not found: ${input.id}`,
        });
      }

      return prisma.topic.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.color !== undefined && { color: input.color }),
        },
      });
    }),

  delete: cmsProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.topic.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Topic not found: ${input.id}`,
        });
      }

      await prisma.topic.delete({ where: { id: input.id } });
      return { success: true };
    }),

  suggestColor: cmsProcedure
    .input(
      z.object({
        name: z.string().trim().min(1, "Name is required"),
        description: z.string().trim().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const descriptionContext = input.description
        ? ` (described as: "${input.description}")`
        : "";
      const prompt = `Given the topic name "${input.name}"${descriptionContext}, suggest a single hex color (e.g. #3b82f6) that visually represents this topic. The color should be vibrant, visually distinct, and suitable as a badge/tag color on a white background. Respond with ONLY the hex color code, nothing else.`;

      try {
        const { text: rawText } = await generateText(prompt);
        const text = rawText.trim();
        const match = text.match(/#[0-9a-fA-F]{6}/);

        if (!match) {
          throw new Error("Model did not return a valid hex color");
        }

        return { color: match[0] };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to suggest a color. Please pick one manually.",
        });
      }
    }),

  suggestDescription: cmsProcedure
    .input(
      z.object({
        name: z.string().trim().min(1, "Name is required"),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `Given the topic name "${input.name}", write a concise description (1–2 sentences) of what kinds of shadowing practice scripts belong under this topic. Focus on themes, vocabulary areas, or scenarios a language learner might practice. Respond with ONLY the description text, nothing else.`;

      try {
        const { text: rawText } = await generateText(prompt);
        const description = rawText.trim();

        if (!description || description.length > 500) {
          throw new Error("Model did not return a valid description");
        }

        return { description };
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to suggest a description. Please write one manually.",
        });
      }
    }),
});
