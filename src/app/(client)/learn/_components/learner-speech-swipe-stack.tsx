"use client";

import {
  animate,
  AnimatePresence,
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

const SPEECH_CARD_TRANSITION = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
};

const SNAP_BACK_SPRING = {
  type: "spring" as const,
  stiffness: 400,
  damping: 35,
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
  navigationDirection,
  onNavigate,
}: LearnerSpeechSwipeStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const dragY = useMotionValue(0);

  const gradientAnimate = !isDragging && !isTransitioning;

  const prevY = useTransform(
    dragY,
    (latest) => -containerHeight - SPEECH_CARD_STACK_GAP_PX + latest
  );
  const nextY = useTransform(
    dragY,
    (latest) => containerHeight + SPEECH_CARD_STACK_GAP_PX + latest
  );

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
    dragY.set(0);
  }, [speechKey, dragY]);

  const cardVariants = {
    enter: (direction: NavigationDirection) => ({
      y:
        direction > 0
          ? `calc(100% + ${SPEECH_CARD_STACK_GAP_PX}px)`
          : direction < 0
            ? `calc(-100% - ${SPEECH_CARD_STACK_GAP_PX}px)`
            : 0,
    }),
    center: {
      y: 0,
    },
    exit: (direction: NavigationDirection) => ({
      y:
        direction > 0
          ? `calc(-100% - ${SPEECH_CARD_STACK_GAP_PX}px)`
          : direction < 0
            ? `calc(100% + ${SPEECH_CARD_STACK_GAP_PX}px)`
            : 0,
    }),
  };

  const handleDragStart = () => {
    if (isTransitioning) {
      return;
    }

    setIsDragging(true);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);

    if (isTransitioning) {
      return;
    }

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

    if (direction !== null) {
      dragY.set(0);
      setIsTransitioning(true);
      onNavigate(direction);
      return;
    }

    void animate(dragY, 0, SNAP_BACK_SPRING);
  };

  const showPrevPreview = isDragging && canGoUp && prevSpeech !== null;
  const showNextPreview = isDragging && canGoDown && nextSpeech !== null;

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
          className="pointer-events-none absolute inset-x-0 top-0 w-full will-change-transform transform-gpu"
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
          className="pointer-events-none absolute inset-x-0 top-0 w-full will-change-transform transform-gpu"
          style={{ y: nextY }}
        >
          <LearnerSpeechCard
            speech={nextSpeech}
            className="mx-0 w-full"
            gradientAnimate={false}
          />
        </motion.div>
      ) : null}

      <AnimatePresence
        mode="sync"
        initial={false}
        custom={navigationDirection}
        onExitComplete={() => setIsTransitioning(false)}
      >
        <motion.div
          key={speechKey}
          className={cn(
            "absolute inset-x-0 top-0 w-full will-change-transform transform-gpu",
            isTransitioning && "pointer-events-none"
          )}
          custom={navigationDirection}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={SPEECH_CARD_TRANSITION}
        >
          <motion.div
            drag={isTransitioning ? false : "y"}
            dragConstraints={{
              top: canGoDown
                ? -(containerHeight + SPEECH_CARD_STACK_GAP_PX)
                : 0,
              bottom: canGoUp ? containerHeight + SPEECH_CARD_STACK_GAP_PX : 0,
            }}
            dragElastic={{
              top: canGoDown ? 0.15 : 0.25,
              bottom: canGoUp ? 0.15 : 0.25,
            }}
            dragMomentum={false}
            style={{ y: dragY }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className="w-full will-change-transform transform-gpu"
          >
            <LearnerSpeechCard
              speech={speech}
              className="mx-0 w-full"
              gradientAnimate={gradientAnimate}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
