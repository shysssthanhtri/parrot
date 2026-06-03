import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/prisma";

import { authProcedure, createTRPCRouter } from "../init";

const scriptFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  content: z.string().trim().min(1, "Content is required"),
});

export const scriptsRouter = createTRPCRouter({
  list: authProcedure.query(async () => {
    return prisma.script.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }),

  getById: authProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const script = await prisma.script.findUnique({
        where: { id: input.id },
      });

      if (!script) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Script not found: ${input.id}`,
        });
      }

      return script;
    }),

  create: authProcedure
    .input(scriptFieldsSchema)
    .mutation(async ({ input, ctx }) => {
      return prisma.script.create({
        data: {
          title: input.title,
          content: input.content,
          userId: ctx.userId,
        },
      });
    }),

  update: authProcedure
    .input(scriptFieldsSchema.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await prisma.script.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Script not found: ${input.id}`,
        });
      }

      return prisma.script.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
        },
      });
    }),
});
