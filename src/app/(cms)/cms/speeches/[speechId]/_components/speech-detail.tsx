import { VolumeXIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { VoiceAudioPreview } from "@/app/(cms)/cms/voices/[voiceId]/_components/voice-audio-preview";
import { ROUTES } from "@/app/configs/routes";
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
import { NORM_LOUDNESS_CONTROL, SPEECH_SLIDERS } from "@/lib/speech-sliders";

type SpeechDetailProps = {
  speech: {
    id: string;
    language: string;
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
    };
  };
  audioUrl: string | null;
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

export function SpeechDetail({ speech, audioUrl }: SpeechDetailProps) {
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

      {!audioUrl ? (
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
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Audio preview</CardTitle>
            <CardDescription>
              Preview the generated speech audio stored for this entry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VoiceAudioPreview audioUrl={audioUrl} />
          </CardContent>
        </Card>
      )}
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
