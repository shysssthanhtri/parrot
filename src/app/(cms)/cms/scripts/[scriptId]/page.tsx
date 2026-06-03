import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import {
  ScriptForm,
  ScriptFormBackLink,
} from "../_components/script-form";

const createCaller = createCallerFactory(appRouter);

type ScriptDetailPageProps = {
  params: Promise<{ scriptId: string }>;
};

export default async function ScriptDetailPage({
  params,
}: ScriptDetailPageProps) {
  const { scriptId } = await params;
  const caller = createCaller(await createTRPCContext());

  let script;
  try {
    script = await caller.scripts.getById({ id: scriptId });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <ScriptFormBackLink />
      <ScriptForm
        mode="edit"
        scriptId={script.id}
        defaultValues={{
          title: script.title,
          content: script.content,
        }}
      />
    </div>
  );
}
