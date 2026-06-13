"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

import { LearnerSpeechCard } from "./learner-speech-card";

function LearnerSpeechCatalogSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <Skeleton className="aspect-13/17 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="mx-auto h-7 w-3/4" />
        <Skeleton className="mx-auto h-4 w-1/2" />
      </div>
      <Skeleton className="mx-auto h-4 w-16" />
    </div>
  );
}

export function LearnerSpeechCatalog() {
  const trpc = useTRPC();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);

  const speechesQuery = useQuery(trpc.speechPublications.list.queryOptions({}));
  const speeches = speechesQuery.data ?? [];

  const activeIndex = useMemo(() => {
    if (speeches.length === 0) {
      return 0;
    }

    return Math.min(Math.max(focusedIndex, 0), speeches.length - 1);
  }, [focusedIndex, speeches.length]);

  const navigateSpeech = (getNextIndex: (currentIndex: number) => number) => {
    setFocusedIndex((currentIndex) => {
      const nextIndex = getNextIndex(currentIndex);

      if (nextIndex !== currentIndex) {
        setHasNavigated(true);
      }

      return nextIndex;
    });
  };

  useEffect(() => {
    if (speeches.length === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        navigateSpeech((currentIndex) =>
          Math.min(currentIndex + 1, speeches.length - 1)
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        navigateSpeech((currentIndex) => Math.max(currentIndex - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [speeches.length]);

  if (speechesQuery.isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <LearnerSpeechCatalogSkeleton />
      </div>
    );
  }

  if (speechesQuery.isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <Empty className="max-w-md border">
          <EmptyHeader>
            <EmptyTitle>Could not load speeches</EmptyTitle>
            <EmptyDescription>
              Something went wrong while loading the catalog. Please refresh and
              try again.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (speeches.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <Empty className="max-w-md border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BookOpen />
            </EmptyMedia>
            <EmptyTitle>No speeches available yet</EmptyTitle>
            <EmptyDescription>
              Published shadowing speeches will appear here when they are ready.
              Check back later.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const focusedSpeech = speeches[activeIndex];
  const canGoUp = activeIndex > 0;
  const canGoDown = activeIndex < speeches.length - 1;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >{`Speech ${activeIndex + 1} of ${speeches.length}: ${focusedSpeech.title}`}</div>
      <div className="grid w-full max-w-3xl grid-cols-[1fr_minmax(0,24rem)_1fr] items-center gap-x-6">
        <div aria-hidden />
        <LearnerSpeechCard speech={focusedSpeech} className="mx-0 w-full" />
        <div className="flex flex-col items-start">
          <div
            aria-hidden={hasNavigated}
            className={cn(
              "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out",
              hasNavigated ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <p
                className={cn(
                  "pb-3 text-xs text-muted-foreground transition-opacity duration-300 ease-in-out",
                  hasNavigated ? "opacity-0" : "opacity-100"
                )}
              >
                Use ↑ ↓ to browse speeches
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!canGoUp}
              aria-label="Previous speech"
              onClick={() =>
                navigateSpeech((currentIndex) => Math.max(currentIndex - 1, 0))
              }
            >
              <ChevronUp />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!canGoDown}
              aria-label="Next speech"
              onClick={() =>
                navigateSpeech((currentIndex) =>
                  Math.min(currentIndex + 1, speeches.length - 1)
                )
              }
            >
              <ChevronDown />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
