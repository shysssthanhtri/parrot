"use client";

import { AlertCircleIcon, Loader2Icon, VolumeXIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { SpeechProcessStatusBadge } from "@/app/(cms)/cms/speeches/_components/speech-process-status-badge";
import { SpeechScriptPlaybackPanel } from "@/app/(cms)/cms/speeches/_components/speech-script-playback-panel";
import { ROUTES } from "@/app/configs/routes";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { getScriptLanguageLabel } from "@/lib/script-languages";
import { getSpeechGenerationProgress } from "@/lib/speech-generation-progress";
import {
  isSpeechInProgress,
  type SpeechProcessStatus,
  speechProcessStatusSchema,
} from "@/lib/speech-process-status";
import type { SpeechScriptAlignment } from "@/lib/speech-script-alignment";
import { NORM_LOUDNESS_CONTROL, SPEECH_SLIDERS } from "@/lib/speech-sliders";

type SpeechDetailProps = {
  speech: {
    id: string;
    language: string;
    processStatus: string;
    errorMessage: string | null;
    totalChunks: number;
    settledChunks: number;
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
  };
  audioUrl: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
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

function getProcessStatus(status: string): SpeechProcessStatus {
  const parsed = speechProcessStatusSchema.safeParse(status);
  return parsed.success ? parsed.data : "pending";
}

function SpeechAudioSection({
  speech,
  audioUrl,
  onRetry,
  isRetrying,
}: SpeechDetailProps) {
  const processStatus = getProcessStatus(speech.processStatus);

  if (processStatus === "failed") {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircleIcon className="size-4" />
            Generation failed
          </CardTitle>
          <CardDescription>
            {speech.errorMessage ??
              "Speech generation failed. Please try again."}
          </CardDescription>
        </CardHeader>
        {onRetry ? (
          <CardContent>
            <Button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              variant="outline"
            >
              {isRetrying ? "Retrying…" : "Retry"}
            </Button>
          </CardContent>
        ) : null}
      </Card>
    );
  }

  if (isSpeechInProgress(processStatus)) {
    const progress = getSpeechGenerationProgress(
      processStatus,
      speech.totalChunks,
      speech.settledChunks
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2Icon className="size-4 animate-spin" />
            {progress?.label ?? "Generating audio"}
          </CardTitle>
          <CardDescription>
            Speech audio is being generated in the background. This page
            refreshes automatically until processing finishes.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {progress ? (
            <Progress value={progress.percent} aria-label={progress.label} />
          ) : null}
          <p className="text-sm text-muted-foreground">
            Script: {speech.script.title}
          </p>
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
      <CardHeader>
        <CardTitle>Audio preview</CardTitle>
        <CardDescription>
          Preview the generated speech audio stored for this entry.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SpeechScriptPlaybackPanel
          audioUrl={audioUrl}
          alignment={speech.alignment}
          scriptContent={speech.script.content}
        />
      </CardContent>
    </Card>
  );
}

export function SpeechDetail({
  speech,
  audioUrl,
  onRetry,
  isRetrying,
}: SpeechDetailProps) {
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
              value={<SpeechProcessStatusBadge status={speech.processStatus} />}
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

      <SpeechAudioSection
        speech={speech}
        audioUrl={audioUrl}
        onRetry={onRetry}
        isRetrying={isRetrying}
      />
    </div>
  );
}

export function SpeechDetailBackLink() {
  return (
    <Link
      href={ROUTES.CMS.SPEECHES}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Back to speeches
    </Link>
  );
}
