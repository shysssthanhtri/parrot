"use client";

import type { inferRouterOutputs } from "@trpc/server";
import * as React from "react";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/trpc/routers/_app";

import {
  getThumbnailLoadIndices,
  shouldLoadThumbnail,
} from "../_lib/thumbnail-load-window";
import { SpeechCard } from "./speech-card";

type SpeechPublication =
  inferRouterOutputs<AppRouter>["speechPublications"]["list"][number];

type SpeechCarouselProps = {
  speeches: SpeechPublication[];
  className?: string;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

function mergeLoadedIndices(
  loadedIndices: Set<number>,
  activeIndex: number,
  speechCount: number
): Set<number> {
  const next = new Set(loadedIndices);

  for (const index of getThumbnailLoadIndices(activeIndex, speechCount)) {
    next.add(index);
  }

  return next;
}

export function SpeechCarousel({ speeches, className }: SpeechCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [loadedIndices, setLoadedIndices] = React.useState(
    () => new Set(getThumbnailLoadIndices(0, speeches.length))
  );

  React.useEffect(() => {
    if (!api || speeches.length === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        api.scrollNext();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        api.scrollPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [api, speeches.length]);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const handleSelect = () => {
      const index = api.selectedScrollSnap();
      setLoadedIndices((current) =>
        mergeLoadedIndices(current, index, speeches.length)
      );
    };

    api.on("select", handleSelect);
    api.on("reInit", handleSelect);

    return () => {
      api.off("select", handleSelect);
      api.off("reInit", handleSelect);
    };
  }, [api, speeches.length]);

  return (
    <Carousel
      orientation="vertical"
      setApi={setApi}
      className={cn(
        "relative h-full min-h-0 w-full md:max-w-[600px]",
        className
      )}
      opts={{ align: "start", containScroll: "trimSnaps" }}
    >
      <CarouselContent className="mt-0 h-full">
        {speeches.map((speech, index) => (
          <CarouselItem
            key={speech.id}
            className="flex h-full items-center justify-center px-4 pt-0"
          >
            <div className="h-full max-h-[500px] md:max-h-[560px] w-full md:max-w-[400px]">
              <SpeechCard
                speech={speech}
                loadThumbnail={shouldLoadThumbnail(index, loadedIndices)}
                priority={index === 0}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="pointer-events-none absolute inset-y-0 right-4 z-10 flex flex-col items-center justify-center gap-3">
        <CarouselPrevious className="pointer-events-auto static rotate-90" />
        <CarouselNext className="pointer-events-auto static rotate-90" />
      </div>
    </Carousel>
  );
}
