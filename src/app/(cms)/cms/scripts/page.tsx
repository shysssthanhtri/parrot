import Link from "next/link";

import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { CMSPageHeader } from "../_components/cms-page-header";
import { ScriptsTable } from "./_components/scripts-table";

const createCaller = createCallerFactory(appRouter);

export default async function ScriptsPage() {
  const caller = createCaller(await createTRPCContext());
  const scripts = await caller.scripts.list();

  return (
    <>
      <CMSPageHeader breadcrumbs={[{ label: "Scripts" }]} />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex justify-end">
          <Button asChild>
            <Link href={ROUTES.CMS.SCRIPT_NEW}>New script</Link>
          </Button>
        </div>
        <ScriptsTable scripts={scripts} />
      </div>
    </>
  );
}
