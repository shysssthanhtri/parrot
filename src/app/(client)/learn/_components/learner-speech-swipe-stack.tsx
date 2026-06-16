"use client";

import {
  animate,
  motion,
  type PanInfo,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
  LearnerSpeechCard,
  type LearnerSpeechCardSpeech,
} from "./learner-speech-card";

const SWIPE_THRESHOLD_PX = 50;
const SWIPE_VELOCITY_THRESHOLD = 500;
const SPEECH_CARD_STACK_GAP_PX = 16;

const SNAP_BACK_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 35,
};

const SETTLE_SPRING = {
  type: "spring" as const,
  stiffness: 350,
  damping: 40,
};

type NavigationDirection = -1 | 0 | 1;

type LearnerSpeechSwipeStackProps = {
  speechKey: string;
  speech: LearnerSpeechCardSpeech;
  prevSpeech: LearnerSpeechCardSpeech | null;
  nextSpeech: LearnerSpeechCardSpeech | null;
  canGoUp: boolean;
  canGoDown: boolean;
  navigationDirection: NavigationDirection;
  onNavigate: (direction: -1 | 1) => void;
};

export function LearnerSpeechSwipeStack({
  speechKey,
  speech,
  prevSpeech,
  nextSpeech,
  canGoUp,
  canGoDown,
  onNavigate,
}: LearnerSpeechSwipeStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settleAnimationRef = useRef<ReturnType<typeof animate> | null>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [settleDirection, setSettleDirection] = useState<-1 | 1 | null>(null);
  const dragY = useMotionValue(0);

  const isGesturing = isDragging || isTransitioning;
  const gradientAnimate = !isGesturing;
  const slotOffset = containerHeight + SPEECH_CARD_STACK_GAP_PX;
  const gpuLayerClass = isGesturing
    ? "will-change-transform transform-gpu"
    : undefined;

  const prevY = useTransform(dragY, (latest) => -slotOffset + latest);
  const nextY = useTransform(dragY, (latest) => slotOffset + latest);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateHeight = () => {
      setContainerHeight(container.offsetHeight);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(container);
    return () => observer.disconnect();
  }, [speechKey]);

  useEffect(() => {
    return () => {
      settleAnimationRef.current?.stop();
    };
  }, []);

  const stopSettleAnimation = () => {
    settleAnimationRef.current?.stop();
    settleAnimationRef.current = null;
    setSettleDirection(null);
    setIsTransitioning(false);
  };

  const handleDragStart = () => {
    stopSettleAnimation();
    setIsDragging(true);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);

    const { offset, velocity } = info;
    let direction: -1 | 1 | null = null;

    if (
      (offset.y < -SWIPE_THRESHOLD_PX ||
        velocity.y < -SWIPE_VELOCITY_THRESHOLD) &&
      canGoDown
    ) {
      direction = 1;
    } else if (
      (offset.y > SWIPE_THRESHOLD_PX ||
        velocity.y > SWIPE_VELOCITY_THRESHOLD) &&
      canGoUp
    ) {
      direction = -1;
    }

    if (direction !== null && slotOffset > 0) {
      const target = direction === 1 ? -slotOffset : slotOffset;

      setSettleDirection(direction);
      setIsTransitioning(true);

      settleAnimationRef.current = animate(dragY, target, {
        ...SETTLE_SPRING,
        velocity: velocity.y,
        onComplete: () => {
          settleAnimationRef.current = null;
          onNavigate(direction);
          dragY.set(0);
          setSettleDirection(null);
          setIsTransitioning(false);
        },
      });
      return;
    }

    if (direction !== null && slotOffset === 0) {
      onNavigate(direction);
      dragY.set(0);
      return;
    }

    void animate(dragY, 0, {
      ...SNAP_BACK_SPRING,
      velocity: velocity.y,
    });
  };

  const showPrevPreview =
    canGoUp &&
    prevSpeech !== null &&
    (isDragging || (isTransitioning && settleDirection === -1));
  const showNextPreview =
    canGoDown &&
    nextSpeech !== null &&
    (isDragging || (isTransitioning && settleDirection === 1));

  return (
    <div
      ref={containerRef}
      className="relative w-full touch-none select-none overflow-hidden"
    >
      <div className="invisible" aria-hidden>
        <LearnerSpeechCard
          speech={speech}
          className="mx-0 w-full"
          gradientAnimate={gradientAnimate}
        />
      </div>

      {showPrevPreview ? (
        <motion.div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 w-full",
            gpuLayerClass
          )}
          style={{ y: prevY }}
        >
          <LearnerSpeechCard
            speech={prevSpeech}
            className="mx-0 w-full"
            gradientAnimate={false}
          />
        </motion.div>
      ) : null}

      {showNextPreview ? (
        <motion.div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 w-full",
            gpuLayerClass
          )}
          style={{ y: nextY }}
        >
          <LearnerSpeechCard
            speech={nextSpeech}
            className="mx-0 w-full"
            gradientAnimate={false}
          />
        </motion.div>
      ) : null}

      <motion.div
        drag="y"
        dragConstraints={{
          top: canGoDown ? -slotOffset : 0,
          bottom: canGoUp ? slotOffset : 0,
        }}
        dragElastic={{
          top: canGoDown ? 0.15 : 0.25,
          bottom: canGoUp ? 0.15 : 0.25,
        }}
        dragMomentum={false}
        style={{ y: dragY }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn("absolute inset-x-0 top-0 w-full", gpuLayerClass)}
      >
        <LearnerSpeechCard
          speech={speech}
          className="mx-0 w-full"
          gradientAnimate={gradientAnimate}
        />
      </motion.div>
    </div>
  );
}
