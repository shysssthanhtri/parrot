import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { ROUTES } from "@/app/configs/routes";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { CMSPageHeader } from "../../_components/cms-page-header";

const createCaller = createCallerFactory(appRouter);

type VoiceDetailLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ voiceId: string }>;
};

export default async function VoiceDetailLayout({
  children,
  params,
}: VoiceDetailLayoutProps) {
  const { voiceId } = await params;
  const caller = createCaller(await createTRPCContext());

  let voice;
  try {
    voice = await caller.voices.getById({ id: voiceId });
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
          { label: "Voices", href: ROUTES.CMS.VOICES },
          { label: voice.name },
        ]}
      />
      {children}
    </>
  );
}
