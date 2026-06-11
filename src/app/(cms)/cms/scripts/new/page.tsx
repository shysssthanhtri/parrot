import { ROUTES } from "@/app/configs/routes";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { CMSPageHeader } from "../../_components/cms-page-header";
import { ScriptForm } from "../_components/script-form";

const createCaller = createCallerFactory(appRouter);

export default async function NewScriptPage() {
  const caller = createCaller(await createTRPCContext());
  const topics = await caller.topics.list();

  return (
    <>
      <CMSPageHeader
        breadcrumbs={[
          { label: "Scripts", href: ROUTES.CMS.SCRIPTS },
          { label: "New" },
        ]}
      />
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <ScriptForm mode="create" topics={topics} />
      </div>
    </>
  );
}
