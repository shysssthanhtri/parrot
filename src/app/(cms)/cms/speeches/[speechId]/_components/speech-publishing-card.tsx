"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { SpeechUnpublishAndRegenerateButton } from "./speech-unpublish-and-regenerate-button";

type PublicationSummary =
  | { status: "not_published" }
  | { status: "published"; publishedAt: Date | null }
  | { status: "unpublished" };

type SpeechPublishingCardProps = {
  scriptTitle: string;
  processStatus: string;
  publication: PublicationSummary;
  onPublish: () => void;
  onUnpublish: () => void;
  onUnpublishAndRegenerate: () => void;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
  isUnpublishAndRegenerating?: boolean;
};

const PUBLICATION_STATUS_LABELS: Record<PublicationSummary["status"], string> =
  {
    not_published: "Not published",
    published: "Published",
    unpublished: "Unpublished",
  };

const PUBLICATION_STATUS_VARIANTS: Record<
  PublicationSummary["status"],
  "default" | "secondary" | "outline"
> = {
  not_published: "secondary",
  published: "default",
  unpublished: "outline",
};

const PUBLICATION_STATUS_COPY: Record<PublicationSummary["status"], string> = {
  not_published:
    "This speech is not visible to learners. Publish when audio generation is finished.",
  published:
    "This speech is live in the learner catalog. Unpublish to hide it or regenerate audio.",
  unpublished:
    "This speech was previously published and is now hidden from learners.",
};

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SpeechPublishingCard({
  scriptTitle,
  processStatus,
  publication,
  onPublish,
  onUnpublish,
  onUnpublishAndRegenerate,
  isPublishing = false,
  isUnpublishing = false,
  isUnpublishAndRegenerating = false,
}: SpeechPublishingCardProps) {
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const isFinished = processStatus === "finished";
  const isPublished = publication.status === "published";
  const canPublish =
    isFinished && !isPublished && !isPublishing && !isUnpublishing;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publishing</CardTitle>
        <CardDescription>
          Control whether learners can access this speech in the catalog.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={PUBLICATION_STATUS_VARIANTS[publication.status]}>
            {PUBLICATION_STATUS_LABELS[publication.status]}
          </Badge>
          {publication.status === "published" && publication.publishedAt ? (
            <span className="text-sm text-muted-foreground">
              Live since {formatTimestamp(publication.publishedAt)}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {PUBLICATION_STATUS_COPY[publication.status]}
        </p>
        <div className="flex flex-wrap gap-2">
          {!isPublished ? (
            <Button type="button" onClick={onPublish} disabled={!canPublish}>
              {isPublishing ? "Publishing…" : "Publish"}
            </Button>
          ) : (
            <>
              <AlertDialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUnpublishing || isUnpublishAndRegenerating}
                  >
                    {isUnpublishing ? "Unpublishing…" : "Unpublish"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unpublish speech</AlertDialogTitle>
                    <AlertDialogDescription>
                      Unpublishing &ldquo;{scriptTitle}&rdquo; removes it from
                      the learner catalog. The frozen snapshot is kept so you
                      can republish later.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onUnpublish();
                        setUnpublishOpen(false);
                      }}
                      disabled={isUnpublishing}
                    >
                      {isUnpublishing ? "Unpublishing…" : "Unpublish"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <SpeechUnpublishAndRegenerateButton
                scriptTitle={scriptTitle}
                onUnpublishAndRegenerate={onUnpublishAndRegenerate}
                isUnpublishAndRegenerating={isUnpublishAndRegenerating}
              />
            </>
          )}
        </div>
        {!isFinished ? (
          <p className="text-sm text-muted-foreground">
            Publishing requires finished audio generation.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function getPublicationStatusLabel(publication: PublicationSummary) {
  return PUBLICATION_STATUS_LABELS[publication.status];
}

export type { PublicationSummary };
