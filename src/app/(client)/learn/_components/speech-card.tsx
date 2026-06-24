import { ImageIcon } from "lucide-react";
import Image from "next/image";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getScriptLengthLabel,
  SCRIPT_GENERATION_LENGTHS,
  type ScriptGenerationLength,
} from "@/lib/script-generation-prompt";

interface MiniThumbnail {
  title: string;
  length: string;
  thumbnailUrl: string | null;
}

interface SpeechCardProps {
  speech: MiniThumbnail;
  loadThumbnail: boolean;
  priority?: boolean;
}

function formatLengthLabel(length: string): string {
  if (SCRIPT_GENERATION_LENGTHS.includes(length as ScriptGenerationLength)) {
    return getScriptLengthLabel(length as ScriptGenerationLength);
  }

  return length;
}

function ThumbnailPlaceholder() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
      <ImageIcon className="size-8" aria-hidden />
      <span className="text-sm">No cover image</span>
    </div>
  );
}

export const SpeechCard = ({
  speech,
  loadThumbnail,
  priority = false,
}: SpeechCardProps) => {
  const metadata = formatLengthLabel(speech.length);
  const showThumbnail = Boolean(speech.thumbnailUrl && loadThumbnail);

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden pt-0">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {showThumbnail ? (
          <Image
            src={speech.thumbnailUrl!}
            alt={`Cover for ${speech.title}`}
            fill
            className="object-cover"
            unoptimized
            priority={priority}
            loading={priority ? undefined : "eager"}
          />
        ) : (
          <ThumbnailPlaceholder />
        )}
      </div>
      <CardHeader className="shrink-0 text-center">
        <CardTitle className="text-xl font-semibold tracking-tight">
          {speech.title}
        </CardTitle>
        <CardDescription>{metadata}</CardDescription>
      </CardHeader>
    </Card>
  );
};
