import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { ROUTES } from "@/app/configs/routes";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { CMSPageHeader } from "../../_components/cms-page-header";

const createCaller = createCallerFactory(appRouter);

type ScriptDetailLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ scriptId: string }>;
};

export default async function ScriptDetailLayout({
  children,
  params,
}: ScriptDetailLayoutProps) {
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
    <>
      <CMSPageHeader
        breadcrumbs={[
          { label: "Scripts", href: ROUTES.CMS.SCRIPTS },
          { label: script.title },
        ]}
      />
      {children}
    </>
  );
}
