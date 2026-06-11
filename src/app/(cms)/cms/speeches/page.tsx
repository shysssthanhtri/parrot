import Link from "next/link";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { CMSPageHeader } from "../_components/cms-page-header";
import { SpeechesTable } from "./_components/speeches-table";

const createCaller = createCallerFactory(appRouter);

export default async function SpeechesPage() {
  const caller = createCaller(await createTRPCContext());
  const speeches = await caller.speeches.list();

  return (
    <>
      <CMSPageHeader breadcrumbs={[{ label: "Speeches" }]} />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex justify-end">
          <Button asChild>
            <Link href={ROUTES.CMS.SPEECH_NEW}>New speech</Link>
          </Button>
        </div>
        <SpeechesTable speeches={speeches} />
      </div>
    </>
  );
}
