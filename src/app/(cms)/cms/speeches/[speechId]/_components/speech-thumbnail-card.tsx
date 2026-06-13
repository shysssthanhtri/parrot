"use client";

import { AlertCircleIcon, ImageIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";

import { SpeechProcessStatusBadge } from "@/app/(cms)/cms/speeches/_components/speech-process-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  isSpeechInProgress,
  speechProcessStatusSchema,
} from "@/lib/speech-process-status";

import { SpeechRegenerateThumbnailButton } from "./speech-regenerate-thumbnail-button";

type SpeechThumbnailCardProps = {
  scriptTitle: string;
  thumbnailProcessStatus: string;
  thumbnailErrorMessage: string | null;
  thumbnailUrl: string | null;
  isPublished: boolean;
  onRegenerateThumbnail?: () => void;
  isRegeneratingThumbnail?: boolean;
};

export function SpeechThumbnailCard({
  scriptTitle,
  thumbnailProcessStatus,
  thumbnailErrorMessage,
  thumbnailUrl,
  isPublished,
  onRegenerateThumbnail,
  isRegeneratingThumbnail = false,
}: SpeechThumbnailCardProps) {
  const parsedStatus = speechProcessStatusSchema.safeParse(
    thumbnailProcessStatus
  );
  const status = parsedStatus.success ? parsedStatus.data : "pending";
  const isGenerating = isSpeechInProgress(status);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <CardTitle>Thumbnail</CardTitle>
          <CardDescription>
            Cover art generated for learner catalog cards.
          </CardDescription>
        </div>
        {!isPublished && onRegenerateThumbnail ? (
          <SpeechRegenerateThumbnailButton
            scriptTitle={scriptTitle}
            onRegenerateThumbnail={onRegenerateThumbnail}
            isRegeneratingThumbnail={isRegeneratingThumbnail}
          />
        ) : null}
      </CardHeader>
      <CardContent className="grid gap-4">
        <SpeechProcessStatusBadge status={thumbnailProcessStatus} />

        {status === "failed" ? (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <p>
              {thumbnailErrorMessage ??
                "Thumbnail generation failed. Please try again."}
            </p>
          </div>
        ) : null}

        {isGenerating ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" />
            <span>
              {status === "pending"
                ? "Thumbnail generation is queued."
                : "Generating thumbnail in the background."}
            </span>
          </div>
        ) : null}

        {status === "finished" && thumbnailUrl ? (
          <div className="relative aspect-13/17 w-full max-w-xs overflow-hidden rounded-lg border bg-muted">
            <Image
              src={thumbnailUrl}
              alt={`Thumbnail preview for ${scriptTitle}`}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ) : null}

        {status === "finished" && !thumbnailUrl ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="size-4" />
            <span>Thumbnail finished but preview is unavailable.</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
