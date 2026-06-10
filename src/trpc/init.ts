import * as Sentry from "@sentry/node";
import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";

import { auth } from "@/auth";

/**
 * This context creator accepts `headers` so it can be reused in both
 * the RSC server caller (where you pass `next/headers`) and the
 * API route handler (where you pass the request headers).
 */
export const createTRPCContext = cache(async () => {
  return {};
});

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    /**
     * @see https://trpc.io/docs/server/data-transformers
     */
    transformer: superjson,
  });

const sentryMiddleware = t.middleware(
  Sentry.trpcMiddleware({
    attachRpcInput: true,
  })
);

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure.use(sentryMiddleware);

export const authProcedure = baseProcedure.use(async ({ next }) => {
  const session = await auth();

  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: { userId: session.user.id, isCmsUser: session.user.isCmsUser },
  });
});

export const cmsProcedure = authProcedure.use(async ({ ctx, next }) => {
  if (!ctx.isCmsUser) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next({ ctx });
});
