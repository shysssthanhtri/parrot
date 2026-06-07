import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import {
  SpeechDetail,
  SpeechDetailBackLink,
} from "./_components/speech-detail";

const createCaller = createCallerFactory(appRouter);

type SpeechDetailPageProps = {
  params: Promise<{ speechId: string }>;
};

export default async function SpeechDetailPage({
  params,
}: SpeechDetailPageProps) {
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
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <SpeechDetailBackLink />
      <SpeechDetail speech={speech} audioUrl={speech.audioUrl} />
    </div>
  );
}
