"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  resolveActiveAlignmentSegment,
  type SpeechScriptAlignment,
} from "@/lib/speech-script-alignment";
import { cn } from "@/lib/utils";

type SpeechScriptSyncViewerProps = {
  alignment: SpeechScriptAlignment;
  currentTimeMs: number;
  className?: string;
};

export function SpeechScriptSyncViewer({
  alignment,
  currentTimeMs,
  className,
}: SpeechScriptSyncViewerProps) {
  const segmentRefs = useRef<Array<HTMLParagraphElement | null>>([]);
  const { index: activeIndex } = useMemo(
    () => resolveActiveAlignmentSegment(alignment, currentTimeMs),
    [alignment, currentTimeMs]
  );

  useEffect(() => {
    segmentRefs.current[activeIndex]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeIndex]);

  return (
    <div
      className={cn(
        "max-h-64 overflow-y-auto rounded-md border bg-background p-4",
        className
      )}
    >
      <div className="flex flex-col gap-3">
        {alignment.segments.map((segment, index) => {
          const segmentState =
            index < activeIndex
              ? "past"
              : index === activeIndex
                ? "active"
                : "upcoming";

          return (
            <p
              key={`${segment.startMs}-${index}`}
              ref={(element) => {
                segmentRefs.current[index] = element;
              }}
              className={cn(
                "rounded-md px-2 py-1 text-sm leading-relaxed transition-colors",
                segmentState === "past" && "text-muted-foreground",
                segmentState === "active" && "bg-accent text-accent-foreground",
                segmentState === "upcoming" && "text-foreground"
              )}
            >
              {segment.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
