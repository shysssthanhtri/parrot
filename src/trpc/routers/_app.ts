import { z } from "zod";

import { baseProcedure, createTRPCRouter } from "../init";
import { scriptGenerationsRouter } from "./script-generations";
import { scriptsRouter } from "./scripts";
import { speechesRouter } from "./speeches";
import { voicesRouter } from "./voices";

export const appRouter = createTRPCRouter({
  voices: voicesRouter,
  scripts: scriptsRouter,
  scriptGenerations: scriptGenerationsRouter,
  speeches: speechesRouter,
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
