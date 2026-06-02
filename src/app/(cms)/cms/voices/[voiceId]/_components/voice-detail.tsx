import { VolumeXIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

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

type VoiceDetailProps = {
  voice: {
    id: string;
    name: string;
    description: string | null;
    language: string;
    r2ObjectKey: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

function formatTimestamp(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function MetadataField({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid gap-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function VoiceDetail({ voice }: VoiceDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{voice.name}</CardTitle>
          <CardDescription>Read-only voice metadata</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <MetadataField label="Name" value={voice.name} />
            <MetadataField label="Language" value={voice.language} />
            <MetadataField
              label="Description"
              value={voice.description ?? "—"}
            />
            <MetadataField
              label="Created"
              value={formatTimestamp(voice.createdAt)}
            />
            <MetadataField
              label="Updated"
              value={formatTimestamp(voice.updatedAt)}
            />
          </dl>
        </CardContent>
      </Card>

      {!voice.r2ObjectKey ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <VolumeXIcon />
            </EmptyMedia>
            <EmptyTitle>No audio available</EmptyTitle>
            <EmptyDescription>
              This voice does not have an audio file yet. Metadata is shown
              above.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
    </div>
  );
}

export function VoiceDetailBackLink() {
  return (
    <Link
      href={ROUTES.CMS.VOICES}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      ← Back to voices
    </Link>
  );
}
