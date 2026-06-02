import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/prisma";

import { authProcedure, createTRPCRouter } from "../init";

export const voicesRouter = createTRPCRouter({
  list: authProcedure.query(async () => {
    return prisma.voice.findMany({
      orderBy: { name: "asc" },
    });
  }),

  getById: authProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const voice = await prisma.voice.findUnique({
        where: { id: input.id },
      });

      if (!voice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Voice not found: ${input.id}`,
        });
      }

      return voice;
    }),
});
