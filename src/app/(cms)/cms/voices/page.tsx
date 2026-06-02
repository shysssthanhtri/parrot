import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { VoicesTable } from "./_components/voices-table";

const createCaller = createCallerFactory(appRouter);

export default async function VoicesPage() {
  const caller = createCaller(await createTRPCContext());
  const voices = await caller.voices.list();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Voices</h1>
      </div>
      <VoicesTable voices={voices} />
    </div>
  );
}
