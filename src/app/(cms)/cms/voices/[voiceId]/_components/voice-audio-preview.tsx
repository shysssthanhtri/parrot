"use client";

import { useWavesurfer } from "@wavesurfer/react";
import { ExternalLinkIcon, PauseIcon, PlayIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/** SSR-safe defaults; match `:root` in globals.css until client theme is read. */
const DEFAULT_WAVE_COLORS = {
  waveColor: "oklch(0.601 0 0)",
  progressColor: "oklch(0.165 0 0)",
} as const;

function readThemeWaveColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    waveColor:
      style.getPropertyValue("--muted-foreground").trim() ||
      DEFAULT_WAVE_COLORS.waveColor,
    progressColor:
      style.getPropertyValue("--primary").trim() ||
      DEFAULT_WAVE_COLORS.progressColor,
  };
}

type VoiceAudioPreviewProps = {
  audioUrl: string;
};

export function VoiceAudioPreview({ audioUrl }: VoiceAudioPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const themeColors = useMemo(() => {
    if (typeof document === "undefined" || !resolvedTheme) {
      return DEFAULT_WAVE_COLORS;
    }
    return readThemeWaveColors();
  }, [resolvedTheme]);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { wavesurfer, isReady, isPlaying, currentTime } = useWavesurfer({
    container: containerRef,
    url: audioUrl,
    height: 88,
    waveColor: themeColors.waveColor,
    progressColor: themeColors.progressColor,
    cursorColor: themeColors.progressColor,
    interact: true,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
  });

  useEffect(() => {
    if (!wavesurfer) return;
    wavesurfer.setOptions({
      waveColor: themeColors.waveColor,
      progressColor: themeColors.progressColor,
      cursorColor: themeColors.progressColor,
    });
  }, [wavesurfer, themeColors]);

  useEffect(() => {
    if (!wavesurfer) return;

    const handleReady = () => {
      setDuration(wavesurfer.getDuration());
      setError(null);
    };
    const handleError = () => {
      setError("Could not load the audio preview.");
    };

    wavesurfer.on("ready", handleReady);
    wavesurfer.on("error", handleError);

    if (wavesurfer.getDuration() > 0) {
      handleReady();
    }

    return () => {
      wavesurfer.un("ready", handleReady);
      wavesurfer.un("error", handleError);
    };
  }, [wavesurfer]);

  const isLoading = !isReady && !error;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative min-h-[88px] w-full">
        <div
          ref={containerRef}
          className="w-full cursor-pointer **:cursor-pointer"
        />
        {isLoading ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80"
            aria-busy="true"
            aria-live="polite"
          >
            <Skeleton className="h-[88px] w-full" />
            <p className="text-sm text-muted-foreground">Loading waveform…</p>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-destructive">{error}</p>
          <a
            href={audioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 text-primary underline-offset-4 hover:underline"
          >
            Open audio in new tab
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => wavesurfer?.playPause()}
            disabled={!isReady}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            {formatAudioTime(currentTime)} / {formatAudioTime(duration)}
          </span>
        </div>
      )}
    </div>
  );
}
