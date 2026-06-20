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

function isThumbnailInProgress(
  generation: { status: string } | null | undefined
) {
  return generation?.status === "processing";
}

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
      const speech = query.state.data;
      if (!speech) {
        return false;
      }

      const parsed = speechProcessStatusSchema.safeParse(speech.processStatus);
      const audioInProgress = parsed.success && isSpeechInProgress(parsed.data);
      const thumbnailInProgress = isThumbnailInProgress(
        speech.thumbnailGeneration
      );

      return audioInProgress || thumbnailInProgress ? POLL_INTERVAL_MS : false;
    },
    refetchOnWindowFocus: (query) => {
      const speech = query.state.data;
      if (!speech) {
        return false;
      }

      return (
        speech.processStatus !== "finished" ||
        isThumbnailInProgress(speech.thumbnailGeneration)
      );
    },
  });

  const publishReadinessQuery = useQuery(
    trpc.speeches.getPublishReadiness.queryOptions({ id: speechId })
  );

  const refetchSpeech = () => {
    void speechQuery.refetch();
    void publishReadinessQuery.refetch();
  };

  const regenerateMutation = useMutation(
    trpc.speeches.regenerate.mutationOptions({
      onSuccess: () => {
        setAudioUrlResetVersion((version) => version + 1);
        toast.success("Regeneration started");
        refetchSpeech();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to regenerate speech");
      },
    })
  );

  const regenerateThumbnailMutation = useMutation(
    trpc.speeches.regenerateThumbnail.mutationOptions({
      onSuccess: () => {
        toast.success("Thumbnail regeneration started");
        refetchSpeech();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to regenerate thumbnail");
      },
    })
  );

  const publishMutation = useMutation(
    trpc.speechPublications.publish.mutationOptions({
      onSuccess: () => {
        toast.success("Speech published");
        refetchSpeech();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to publish speech");
      },
    })
  );

  const unpublishMutation = useMutation(
    trpc.speechPublications.unpublish.mutationOptions({
      onSuccess: () => {
        toast.success("Speech unpublished");
        refetchSpeech();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to unpublish speech");
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

  const isPublished = speech.publication.status === "published";

  return (
    <div className="flex flex-col gap-6">
      <SpeechDetail
        speech={speech}
        audioUrl={audioUrl}
        thumbnailUrl={speech.thumbnailUrl}
        publishReadinessIssues={publishReadinessQuery.data?.issues ?? []}
        canRegenerate={speech.canRegenerate}
        onRegenerate={
          speech.canRegenerate
            ? () => regenerateMutation.mutate({ id: speechId })
            : undefined
        }
        isRegenerating={regenerateMutation.isPending}
        onRegenerateThumbnail={
          !isPublished
            ? () => regenerateThumbnailMutation.mutate({ id: speechId })
            : undefined
        }
        isRegeneratingThumbnail={regenerateThumbnailMutation.isPending}
        onPublish={() => publishMutation.mutate({ id: speechId })}
        onUnpublish={() => unpublishMutation.mutate({ id: speechId })}
        isPublishing={publishMutation.isPending}
        isUnpublishing={unpublishMutation.isPending}
      />
      <SpeechDeleteButton
        speechId={speechId}
        scriptTitle={speech.script.title}
        isPublished={isPublished}
      />
    </div>
  );
}
