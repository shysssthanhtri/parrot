import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { ScriptForm, ScriptFormBackLink } from "../_components/script-form";

const createCaller = createCallerFactory(appRouter);

export default async function NewScriptPage() {
  const caller = createCaller(await createTRPCContext());
  const topics = await caller.topics.list();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <ScriptFormBackLink />
      <ScriptForm mode="create" topics={topics} />
    </div>
  );
}
