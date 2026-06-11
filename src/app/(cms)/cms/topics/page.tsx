import Link from "next/link";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { CMSPageHeader } from "../_components/cms-page-header";
import { TopicsTable } from "./_components/topics-table";

const createCaller = createCallerFactory(appRouter);

export default async function TopicsPage() {
  const caller = createCaller(await createTRPCContext());
  const topics = await caller.topics.list();

  return (
    <>
      <CMSPageHeader breadcrumbs={[{ label: "Topics" }]} />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex justify-end">
          <Button asChild>
            <Link href={ROUTES.CMS.TOPIC_NEW}>New topic</Link>
          </Button>
        </div>
        <TopicsTable topics={topics} />
      </div>
    </>
  );
}
