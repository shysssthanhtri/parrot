"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useReducer, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
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
    <Card className="mx-auto w-full max-w-sm overflow-hidden pt-0">
      <Skeleton className="aspect-13/17 w-full rounded-none" />
      <CardHeader className="text-center">
        <Skeleton className="mx-auto h-7 w-3/4" />
        <Skeleton className="mx-auto h-4 w-1/2" />
      </CardHeader>
    </Card>
  );
}

type NavigationDirection = -1 | 0 | 1;

type CatalogNavigationState = {
  focusedIndex: number;
  navigationDirection: NavigationDirection;
  hasNavigated: boolean;
};

type CatalogNavigationAction = {
  type: "navigate";
  direction: -1 | 1;
  speechCount: number;
};

function catalogNavigationReducer(
  state: CatalogNavigationState,
  action: CatalogNavigationAction
): CatalogNavigationState {
  const maxIndex = Math.max(action.speechCount - 1, 0);
  const nextIndex =
    action.direction > 0
      ? Math.min(state.focusedIndex + 1, maxIndex)
      : Math.max(state.focusedIndex - 1, 0);

  if (nextIndex === state.focusedIndex) {
    return state;
  }

  return {
    focusedIndex: nextIndex,
    navigationDirection: action.direction,
    hasNavigated: true,
  };
}

type SpeechWithThumbnail = {
  thumbnailUrl: string | null;
};

function getUpcomingThumbnailUrls(
  speeches: SpeechWithThumbnail[],
  activeIndex: number,
  count = 2
): string[] {
  const urls: string[] = [];

  for (let offset = 1; offset <= count; offset += 1) {
    const index = activeIndex + offset;
    if (index >= speeches.length) {
      break;
    }

    const thumbnailUrl = speeches[index]?.thumbnailUrl;
    if (thumbnailUrl) {
      urls.push(thumbnailUrl);
    }
  }

  return urls;
}

export function LearnerSpeechCatalog() {
  const trpc = useTRPC();
  const prefersReducedMotion = useReducedMotion();
  const [
    { focusedIndex, navigationDirection, hasNavigated },
    dispatchNavigation,
  ] = useReducer(catalogNavigationReducer, {
    focusedIndex: 0,
    navigationDirection: 0,
    hasNavigated: false,
  });

  const slideOffset = prefersReducedMotion ? 0 : "100%";
  const transitionDuration = prefersReducedMotion ? 0 : 0.5;
  const cardVariants = {
    enter: (direction: NavigationDirection) => ({
      y: direction > 0 ? slideOffset : direction < 0 ? `-${slideOffset}` : 0,
    }),
    center: {
      y: 0,
    },
    exit: (direction: NavigationDirection) => ({
      y: direction > 0 ? `-${slideOffset}` : direction < 0 ? slideOffset : 0,
    }),
  };

  const speechesQuery = useQuery(trpc.speechPublications.list.queryOptions({}));
  const speeches = speechesQuery.data ?? [];
  const prefetchedThumbnailUrls = useRef(new Set<string>());

  const activeIndex = useMemo(() => {
    if (speeches.length === 0) {
      return 0;
    }

    return Math.min(Math.max(focusedIndex, 0), speeches.length - 1);
  }, [focusedIndex, speeches.length]);

  const navigateSpeech = (direction: -1 | 1) => {
    dispatchNavigation({
      type: "navigate",
      direction,
      speechCount: speeches.length,
    });
  };

  useEffect(() => {
    const list = speechesQuery.data;
    if (!list || list.length === 0) {
      return;
    }

    for (const url of getUpcomingThumbnailUrls(list, activeIndex)) {
      if (prefetchedThumbnailUrls.current.has(url)) {
        continue;
      }

      prefetchedThumbnailUrls.current.add(url);
      const image = new Image();
      image.src = url;
    }
  }, [speechesQuery.data, activeIndex]);

  useEffect(() => {
    if (speeches.length === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        navigateSpeech(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        navigateSpeech(-1);
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
        <div className="relative w-full overflow-hidden">
          <div className="invisible" aria-hidden>
            <LearnerSpeechCard speech={focusedSpeech} className="mx-0 w-full" />
          </div>
          <AnimatePresence
            mode="sync"
            initial={false}
            custom={navigationDirection}
          >
            <motion.div
              key={focusedSpeech.id}
              className="absolute inset-x-0 top-0 w-full"
              custom={navigationDirection}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: transitionDuration,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <LearnerSpeechCard
                speech={focusedSpeech}
                className="mx-0 w-full"
              />
            </motion.div>
          </AnimatePresence>
        </div>
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
              onClick={() => navigateSpeech(-1)}
            >
              <ChevronUp />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={!canGoDown}
              aria-label="Next speech"
              onClick={() => navigateSpeech(1)}
            >
              <ChevronDown />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
