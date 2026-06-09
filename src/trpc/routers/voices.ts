import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@/prisma";

import { cmsProcedure, createTRPCRouter } from "../init";

export const voicesRouter = createTRPCRouter({
  list: cmsProcedure.query(async () => {
    return prisma.voice.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: cmsProcedure
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
