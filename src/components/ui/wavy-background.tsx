"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createNoise3D } from "simplex-noise";

import { cn } from "@/lib/utils";

const DEFAULT_WAVE_COLORS = [
  "#38bdf8",
  "#818cf8",
  "#c084fc",
  "#e879f9",
  "#22d3ee",
];

type WavyBackgroundProps = React.PropsWithChildren<{
  className?: string;
  containerClassName?: string;
  colors?: string[];
  waveWidth?: number;
  backgroundFill?: string;
  blur?: number;
  speed?: "slow" | "fast";
  waveOpacity?: number;
  /** Vertical anchor for waves as a fraction of container height (0 = top, 1 = bottom). */
  waveYPosition?: number;
}> &
  React.HTMLAttributes<HTMLDivElement>;

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  waveYPosition = 0.5,
  ...props
}: WavyBackgroundProps) => {
  const noise = useMemo(() => createNoise3D(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationIdRef = useRef<number | undefined>(undefined);
  const dimensionsRef = useRef({ w: 0, h: 0, nt: 0 });
  const waveColorsRef = useRef(colors ?? DEFAULT_WAVE_COLORS);
  const backgroundFillRef = useRef(backgroundFill);
  const waveOpacityRef = useRef(waveOpacity);
  const waveWidthRef = useRef(waveWidth);
  const blurRef = useRef(blur);
  const speedRef = useRef(speed);
  const waveYPositionRef = useRef(waveYPosition);

  useEffect(() => {
    waveColorsRef.current = colors ?? DEFAULT_WAVE_COLORS;
    backgroundFillRef.current = backgroundFill;
    waveOpacityRef.current = waveOpacity;
    waveWidthRef.current = waveWidth;
    blurRef.current = blur;
    speedRef.current = speed;
    waveYPositionRef.current = waveYPosition;
  }, [
    colors,
    backgroundFill,
    waveOpacity,
    waveWidth,
    blur,
    speed,
    waveYPosition,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctxRef.current = ctx;
    dimensionsRef.current.nt = 0;

    const getSpeed = () => {
      switch (speedRef.current) {
        case "slow":
          return 0.001;
        case "fast":
          return 0.002;
        default:
          return 0.001;
      }
    };

    const resizeCanvas = () => {
      const context = ctxRef.current;
      const bounds = containerRef.current?.getBoundingClientRect();
      if (!context || !bounds) return;

      dimensionsRef.current.w = context.canvas.width = bounds.width;
      dimensionsRef.current.h = context.canvas.height = bounds.height;
      context.filter = `blur(${blurRef.current}px)`;
    };

    const drawWave = (n: number) => {
      const context = ctxRef.current;
      const { w, h } = dimensionsRef.current;
      if (!context) return;

      dimensionsRef.current.nt += getSpeed();
      const nt = dimensionsRef.current.nt;
      const waveColors = waveColorsRef.current;
      const waveAnchor = h * waveYPositionRef.current;

      for (let i = 0; i < n; i++) {
        context.beginPath();
        context.lineWidth = waveWidthRef.current || 50;
        context.strokeStyle = waveColors[i % waveColors.length];
        for (let x = 0; x < w; x += 5) {
          const y = noise(x / 800, 0.3 * i, nt) * 100;
          context.lineTo(x, y + waveAnchor);
        }
        context.stroke();
        context.closePath();
      }
    };

    const animationLoop = () => {
      const context = ctxRef.current;
      const { w, h } = dimensionsRef.current;
      if (!context) return;

      context.fillStyle = backgroundFillRef.current || "black";
      context.globalAlpha = waveOpacityRef.current || 0.5;
      context.fillRect(0, 0, w, h);
      drawWave(5);
      animationIdRef.current = requestAnimationFrame(animationLoop);
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    animationLoop();

    return () => {
      resizeObserver.disconnect();
      if (animationIdRef.current !== undefined) {
        cancelAnimationFrame(animationIdRef.current);
      }
      ctxRef.current = null;
    };
  }, [noise]);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    // I'm sorry but i have got to support it on safari.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSafari(
      typeof window !== "undefined" &&
        navigator.userAgent.includes("Safari") &&
        !navigator.userAgent.includes("Chrome")
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-screen flex flex-col items-center justify-center overflow-hidden",
        containerClassName
      )}
    >
      <canvas
        aria-hidden
        className="absolute inset-0 -z-20"
        ref={canvasRef}
        id="canvas"
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}
      ></canvas>
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
};
