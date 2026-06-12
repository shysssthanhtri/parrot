import { z } from "zod";

import { baseProcedure, createTRPCRouter } from "../init";
import { scriptGenerationsRouter } from "./script-generations";
import { scriptsRouter } from "./scripts";
import { speechPublicationsRouter } from "./speech-publications";
import { speechesRouter } from "./speeches";
import { topicsRouter } from "./topics";
import { voicesRouter } from "./voices";

export const appRouter = createTRPCRouter({
  voices: voicesRouter,
  scripts: scriptsRouter,
  scriptGenerations: scriptGenerationsRouter,
  speeches: speechesRouter,
  speechPublications: speechPublicationsRouter,
  topics: topicsRouter,
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
