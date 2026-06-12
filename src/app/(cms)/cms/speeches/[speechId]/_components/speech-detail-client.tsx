"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { Loader2Icon } from "lucide-react";
import { notFound } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  isSpeechInProgress,
  speechProcessStatusSchema,
} from "@/lib/speech-process-status";
import { useTRPC } from "@/trpc/client";

import { SpeechDeleteButton } from "./speech-delete-button";
import { SpeechDetail } from "./speech-detail";

const POLL_INTERVAL_MS = 10_000;

type SpeechDetailClientProps = {
  speechId: string;
};

export function SpeechDetailClient({ speechId }: SpeechDetailClientProps) {
  const trpc = useTRPC();
  const [stableAudioUrl, setStableAudioUrl] = useState<string | null>(null);
  const [audioUrlResetVersion, setAudioUrlResetVersion] = useState(0);
  const [pinnedAudioUrlVersion, setPinnedAudioUrlVersion] = useState(0);

  const speechQuery = useQuery({
    ...trpc.speeches.getById.queryOptions({ id: speechId }),
    refetchInterval: (query) => {
      const status = query.state.data?.processStatus;
      const parsed = status
        ? speechProcessStatusSchema.safeParse(status)
        : null;
      return parsed?.success && isSpeechInProgress(parsed.data)
        ? POLL_INTERVAL_MS
        : false;
    },
    refetchOnWindowFocus: (query) =>
      query.state.data?.processStatus !== "finished",
  });

  const regenerateMutation = useMutation(
    trpc.speeches.regenerate.mutationOptions({
      onSuccess: () => {
        setAudioUrlResetVersion((version) => version + 1);
        toast.success("Regeneration started");
        void speechQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to regenerate speech");
      },
    })
  );

  if (speechQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
      </div>
    );
  }

  if (speechQuery.error) {
    if (
      speechQuery.error instanceof TRPCClientError &&
      speechQuery.error.data?.code === "NOT_FOUND"
    ) {
      notFound();
    }

    throw speechQuery.error;
  }

  if (!speechQuery.data) {
    notFound();
  }

  const speech = speechQuery.data;

  if (speech.processStatus !== "finished" || !speech.audioUrl) {
    if (stableAudioUrl !== null) {
      setStableAudioUrl(null);
    }
  } else if (
    stableAudioUrl === null ||
    pinnedAudioUrlVersion !== audioUrlResetVersion
  ) {
    setStableAudioUrl(speech.audioUrl);
    setPinnedAudioUrlVersion(audioUrlResetVersion);
  }

  const audioUrl =
    speech.processStatus === "finished"
      ? (stableAudioUrl ?? speech.audioUrl)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <SpeechDetail
        speech={speech}
        audioUrl={audioUrl}
        canRegenerate={speech.canRegenerate}
        onRegenerate={
          speech.canRegenerate
            ? () => regenerateMutation.mutate({ id: speechId })
            : undefined
        }
        isRegenerating={regenerateMutation.isPending}
      />
      <SpeechDeleteButton
        speechId={speechId}
        scriptTitle={speech.script.title}
      />
    </div>
  );
}
