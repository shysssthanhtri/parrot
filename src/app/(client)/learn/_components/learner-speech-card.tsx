import { ImageIcon } from "lucide-react";
import Image from "next/image";

import {
  getScriptLengthLabel,
  SCRIPT_GENERATION_LENGTHS,
  type ScriptGenerationLength,
} from "@/lib/script-generation-prompt";
import { getScriptLanguageLabel } from "@/lib/script-languages";
import { cn } from "@/lib/utils";

export type LearnerSpeechCardSpeech = {
  title: string;
  language: string;
  length: string;
  voiceName: string;
  thumbnailUrl: string | null;
};

type LearnerSpeechCardProps = {
  speech: LearnerSpeechCardSpeech;
  className?: string;
};

function formatLengthLabel(length: string): string {
  if (SCRIPT_GENERATION_LENGTHS.includes(length as ScriptGenerationLength)) {
    return getScriptLengthLabel(length as ScriptGenerationLength);
  }

  return length;
}

export function LearnerSpeechCard({
  speech,
  className,
}: LearnerSpeechCardProps) {
  const metadata = [
    formatLengthLabel(speech.length),
    getScriptLanguageLabel(speech.language),
    speech.voiceName,
  ].join(" · ");

  return (
    <article
      className={cn("mx-auto flex w-full max-w-sm flex-col gap-4", className)}
    >
      <div className="relative aspect-13/17 w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        {speech.thumbnailUrl ? (
          <Image
            src={speech.thumbnailUrl}
            alt={`Cover for ${speech.title}`}
            fill
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" aria-hidden />
            <span className="text-sm">No cover image</span>
          </div>
        )}
      </div>
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold tracking-tight">{speech.title}</h2>
        <p className="text-sm text-muted-foreground">{metadata}</p>
      </div>
    </article>
  );
}
