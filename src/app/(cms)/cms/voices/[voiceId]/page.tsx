import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";

import { getAudioUrl } from "@/lib/r2";
import { createCallerFactory, createTRPCContext } from "@/trpc/init";
import { appRouter } from "@/trpc/routers/_app";

import { VoiceDetail, VoiceDetailBackLink } from "./_components/voice-detail";

const createCaller = createCallerFactory(appRouter);

type VoiceDetailPageProps = {
  params: Promise<{ voiceId: string }>;
};

export default async function VoiceDetailPage({
  params,
}: VoiceDetailPageProps) {
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

  const audioUrl = voice.r2ObjectKey
    ? await getAudioUrl(voice.r2ObjectKey)
    : null;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <VoiceDetailBackLink />
      <VoiceDetail voice={voice} audioUrl={audioUrl} />
    </div>
  );
}
