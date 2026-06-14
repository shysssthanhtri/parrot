import { ImageIcon } from "lucide-react";
import Image from "next/image";

import { BackgroundGradient } from "@/components/ui/background-gradient";
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
import { cn } from "@/lib/utils";

export type LearnerSpeechCardSpeech = {
  title: string;
  length: string;
  thumbnailUrl: string | null;
};

const GRADIENT_BORDER_CONTAINER_CLASS = "!p-[2px]";
const GRADIENT_BORDER_RADIUS_CLASS = "rounded-[calc(var(--radius-xl)+2px)]";

type LearnerSpeechCardProps = {
  speech: LearnerSpeechCardSpeech;
  className?: string;
  gradientContainerClassName?: string;
  gradientRoundedClassName?: string;
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
  gradientContainerClassName = GRADIENT_BORDER_CONTAINER_CLASS,
  gradientRoundedClassName = GRADIENT_BORDER_RADIUS_CLASS,
}: LearnerSpeechCardProps) {
  const metadata = formatLengthLabel(speech.length);

  return (
    <BackgroundGradient
      containerClassName={gradientContainerClassName}
      roundedClassName={gradientRoundedClassName}
    >
      <Card
        className={cn(
          "mx-auto w-full max-w-sm overflow-hidden rounded-xl pt-0 ring-0",
          className
        )}
      >
        <div className="relative aspect-13/17 w-full overflow-hidden rounded-t-xl">
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
        <CardHeader className="rounded-b-xl text-center">
          <CardTitle className="text-xl font-semibold tracking-tight">
            {speech.title}
          </CardTitle>
          <CardDescription>{metadata}</CardDescription>
        </CardHeader>
      </Card>
    </BackgroundGradient>
  );
}
