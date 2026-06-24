import { getLearnRequestTimer } from "@/lib/server-timing";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { SpeechCarousel } from "./_components/speech-carousel";

const createCaller = createCallerFactory(appRouter);

export default async function LearnPage() {
  const timer = getLearnRequestTimer();
  const caller = createCaller(await createTRPCContext());
  const speeches = await timer.measure("list", () =>
    caller.speechPublications.list({})
  );
  timer.log();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden w-full items-center">
      <SpeechCarousel speeches={speeches} />
    </div>
  );
}
