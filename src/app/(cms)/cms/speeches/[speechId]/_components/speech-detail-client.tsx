"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import { Loader2Icon } from "lucide-react";
import { notFound } from "next/navigation";
import { toast } from "sonner";

import {
  isSpeechInProgress,
  speechProcessStatusSchema,
} from "@/lib/speech-process-status";
import { useTRPC } from "@/trpc/client";

import { SpeechDetail } from "./speech-detail";

const POLL_INTERVAL_MS = 60_000;

type SpeechDetailClientProps = {
  speechId: string;
};

export function SpeechDetailClient({ speechId }: SpeechDetailClientProps) {
  const trpc = useTRPC();

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
  });

  const retryMutation = useMutation(
    trpc.speeches.retry.mutationOptions({
      onSuccess: () => {
        toast.success("Retry started");
        void speechQuery.refetch();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to retry speech");
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

  return (
    <SpeechDetail
      speech={speechQuery.data}
      audioUrl={speechQuery.data.audioUrl}
      onRetry={
        speechQuery.data.processStatus === "failed"
          ? () => retryMutation.mutate({ id: speechId })
          : undefined
      }
      isRetrying={retryMutation.isPending}
    />
  );
}
