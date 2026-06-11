import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { ROUTES } from "@/app/configs/routes";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { CMSPageHeader } from "../../_components/cms-page-header";

const createCaller = createCallerFactory(appRouter);

type SpeechDetailLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ speechId: string }>;
};

export default async function SpeechDetailLayout({
  children,
  params,
}: SpeechDetailLayoutProps) {
  const { speechId } = await params;
  const caller = createCaller(await createTRPCContext());

  let speech;
  try {
    speech = await caller.speeches.getById({ id: speechId });
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
          { label: "Speeches", href: ROUTES.CMS.SPEECHES },
          { label: speech.script.title },
        ]}
      />
      {children}
    </>
  );
}
