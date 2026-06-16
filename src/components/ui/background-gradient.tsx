import React from "react";

import { cn } from "@/lib/utils";

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  roundedClassName = "rounded-[calc(var(--radius-xl)+4px)]",
  contentRoundedClassName = "rounded-xl",
  animate = true,
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /** Outer radius; defaults to card `rounded-xl` + 4px padding. */
  roundedClassName?: string;
  /** Inner content radius; defaults to `rounded-xl` to match the outer padding inset. */
  contentRoundedClassName?: string;
  animate?: boolean;
}) => {
  const rgbConicGradient =
    "conic-gradient(from 0deg, #ff0033, #ff6600, #ffff00, #00ff66, #00ccff, #0066ff, #8800ff, #ff0033)";

  const spinLayerClassName = cn(
    "absolute -inset-full z-[1] will-change-transform",
    animate && "animate-gradient-border-spin",
    roundedClassName
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden p-[4px] group",
        roundedClassName,
        containerClassName
      )}
    >
      <div
        style={{ backgroundImage: rgbConicGradient }}
        className={cn(
          spinLayerClassName,
          "opacity-75 group-hover:opacity-100 blur-xl transition-opacity duration-500"
        )}
      />
      <div
        style={{ backgroundImage: rgbConicGradient }}
        className={spinLayerClassName}
      />

      <div
        className={cn(
          "relative z-10 overflow-hidden",
          contentRoundedClassName,
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};
