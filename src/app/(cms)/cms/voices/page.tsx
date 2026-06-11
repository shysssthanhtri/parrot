import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { CMSPageHeader } from "../_components/cms-page-header";
import { VoicesTable } from "./_components/voices-table";

const createCaller = createCallerFactory(appRouter);

export default async function VoicesPage() {
  const caller = createCaller(await createTRPCContext());
  const voices = await caller.voices.list();

  return (
    <>
      <CMSPageHeader breadcrumbs={[{ label: "Voices" }]} />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <VoicesTable voices={voices} />
      </div>
    </>
  );
}
