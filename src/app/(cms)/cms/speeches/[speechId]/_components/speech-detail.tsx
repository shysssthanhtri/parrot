"use client";

import { AlertCircleIcon, Loader2Icon, VolumeXIcon } from "lucide-react";
import type { ReactNode } from "react";

import { SpeechProcessStatusBadge } from "@/app/(cms)/cms/speeches/_components/speech-process-status-badge";
import { SpeechScriptPlaybackPanel } from "@/app/(cms)/cms/speeches/_components/speech-script-playback-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { getScriptLanguageLabel } from "@/lib/script-languages";
import { isSpeechTtsGenerating } from "@/lib/speech-process-status";
import type { SpeechScriptAlignment } from "@/lib/speech-script-alignment";
import { NORM_LOUDNESS_CONTROL, SPEECH_SLIDERS } from "@/lib/speech-sliders";

import {
  getPublicationStatusLabel,
  type PublicationSummary,
  SpeechPublishingCard,
} from "./speech-publishing-card";
import { SpeechRegenerateButton } from "./speech-regenerate-button";
import { SpeechThumbnailCard } from "./speech-thumbnail-card";

type TtsGeneration = {
  status: "processing" | "finished" | "failed";
  errorMessage: string | null;
};

type SpeechDetailProps = {
  speech: {
    id: string;
    language: string;
    ttsGeneration: TtsGeneration | null;
    temperature: number;
    topP: number;
    topK: number;
    repetitionPenalty: number;
    normLoudness: boolean;
    createdAt: Date;
    updatedAt: Date;
    voice: {
      name: string;
    };
    script: {
      title: string;
      content: string;
    };
    alignment: SpeechScriptAlignment | null;
    publication: PublicationSummary;
    thumbnailGeneration: {
      status: "processing" | "finished" | "failed";
      errorMessage: string | null;
    } | null;
  };
  audioUrl: string | null;
  thumbnailUrl: string | null;
  publishReadinessIssues: { code: string; message: string }[];
  canRegenerate?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onRegenerateThumbnail?: () => void;
  isRegeneratingThumbnail?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  isPublishing?: boolean;
  isUnpublishing?: boolean;
};

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function MetadataField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function SpeechRegenerateAction({
  speech,
  onRegenerate,
  isRegenerating,
  canRegenerate,
}: Pick<
  SpeechDetailProps,
  "speech" | "onRegenerate" | "isRegenerating" | "canRegenerate"
>) {
  if (!onRegenerate || !canRegenerate) {
    return null;
  }

  return (
    <SpeechRegenerateButton
      scriptTitle={speech.script.title}
      onRegenerate={onRegenerate}
      isRegenerating={isRegenerating}
    />
  );
}

function SpeechAudioSection({
  speech,
  audioUrl,
  canRegenerate,
  onRegenerate,
  isRegenerating,
}: Pick<
  SpeechDetailProps,
  "speech" | "audioUrl" | "canRegenerate" | "onRegenerate" | "isRegenerating"
>) {
  const ttsStatus = speech.ttsGeneration?.status ?? "processing";

  if (ttsStatus === "failed") {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircleIcon className="size-4" />
            Generation failed
          </CardTitle>
          <CardDescription>
            {speech.ttsGeneration?.errorMessage ??
              "Speech generation failed. Please try again."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpeechRegenerateAction
            speech={speech}
            onRegenerate={onRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
          />
        </CardContent>
      </Card>
    );
  }

  if (isSpeechTtsGenerating(ttsStatus)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2Icon className="size-4 animate-spin" />
            Generating audio…
          </CardTitle>
          <CardDescription>
            Speech audio is being generated in the background. This page
            refreshes automatically until processing finishes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Script: {speech.script.title}
          </p>
          <SpeechRegenerateAction
            speech={speech}
            onRegenerate={onRegenerate}
            isRegenerating={isRegenerating}
            canRegenerate={canRegenerate}
          />
        </CardContent>
      </Card>
    );
  }

  if (!audioUrl) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <VolumeXIcon />
          </EmptyMedia>
          <EmptyTitle>No audio available</EmptyTitle>
          <EmptyDescription>
            This speech does not have playable audio yet. Metadata is shown
            above.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="grid gap-1.5">
          <CardTitle>Audio preview</CardTitle>
          <CardDescription>
            Preview the generated speech audio stored for this entry.
          </CardDescription>
        </div>
        <SpeechRegenerateAction
          speech={speech}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
        />
      </CardHeader>
      <CardContent>
        <SpeechScriptPlaybackPanel
          audioUrl={audioUrl}
          alignment={speech.alignment}
          scriptContent={speech.script.content}
          scriptTitle={speech.script.title}
          onRegenerate={onRegenerate}
          isRegenerating={isRegenerating}
          canRegenerate={canRegenerate}
        />
      </CardContent>
    </Card>
  );
}

export function SpeechDetail({
  speech,
  audioUrl,
  thumbnailUrl,
  publishReadinessIssues,
  canRegenerate,
  onRegenerate,
  isRegenerating,
  onRegenerateThumbnail,
  isRegeneratingThumbnail,
  onPublish,
  onUnpublish,
  isPublishing,
  isUnpublishing,
}: SpeechDetailProps) {
  const isPublished = speech.publication.status === "published";

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{speech.script.title}</CardTitle>
          <CardDescription>Read-only speech metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <MetadataField label="Script" value={speech.script.title} />
            <MetadataField label="Voice" value={speech.voice.name} />
            <MetadataField
              label="Language"
              value={getScriptLanguageLabel(speech.language)}
            />
            <MetadataField
              label="Status"
              value={
                <SpeechProcessStatusBadge
                  status={speech.ttsGeneration?.status}
                />
              }
            />
            <MetadataField
              label="Publication"
              value={getPublicationStatusLabel(speech.publication)}
            />
            {SPEECH_SLIDERS.map((slider) => (
              <MetadataField
                key={slider.id}
                label={slider.label}
                value={speech[slider.id]}
              />
            ))}
            <MetadataField
              label={NORM_LOUDNESS_CONTROL.label}
              value={speech.normLoudness ? "On" : "Off"}
            />
            <MetadataField
              label="Created"
              value={formatTimestamp(speech.createdAt)}
            />
            <MetadataField
              label="Updated"
              value={formatTimestamp(speech.updatedAt)}
            />
          </dl>
        </CardContent>
      </Card>

      {onPublish && onUnpublish ? (
        <SpeechPublishingCard
          scriptTitle={speech.script.title}
          publication={speech.publication}
          publishReadinessIssues={publishReadinessIssues}
          onPublish={onPublish}
          onUnpublish={onUnpublish}
          isPublishing={isPublishing}
          isUnpublishing={isUnpublishing}
        />
      ) : null}

      <SpeechThumbnailCard
        scriptTitle={speech.script.title}
        thumbnailGeneration={speech.thumbnailGeneration}
        thumbnailUrl={thumbnailUrl}
        isPublished={isPublished}
        onRegenerateThumbnail={onRegenerateThumbnail}
        isRegeneratingThumbnail={isRegeneratingThumbnail}
      />

      <SpeechAudioSection
        speech={speech}
        audioUrl={audioUrl}
        canRegenerate={canRegenerate}
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
      />
    </div>
  );
}
