import Link from "next/link";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { TopicsTable } from "./_components/topics-table";

const createCaller = createCallerFactory(appRouter);

export default async function TopicsPage() {
  const caller = createCaller(await createTRPCContext());
  const topics = await caller.topics.list();

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Topics</h1>
        <Button asChild>
          <Link href={ROUTES.CMS.TOPIC_NEW}>New topic</Link>
        </Button>
      </div>
      <TopicsTable topics={topics} />
    </div>
  );
}
