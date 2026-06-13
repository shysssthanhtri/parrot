"use client";

import { ArrowRight, Wifi } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { HoverBorderGradient } from "./ui/hover-border-gradient";
import { WavyBackground } from "./ui/wavy-background";

interface Image {
  src: string;
  alt: string;
  srcDark?: string;
  srcMobile?: string;
}
interface Button {
  text: string;
  url: string;
  icon?: React.ReactNode;
}
interface Buttons {
  primary?: Button;
  secondary?: Button;
}

interface HeroBasicProps {
  heading: string;
  description: string;
  buttons?: Buttons;
  image: Image;
  byline?: string;
  className?: string;
  icon?: React.ReactNode;
}

type Hero115Props = HeroBasicProps;
type Props = Partial<Hero115Props>;

const defaultProps: Hero115Props = {
  heading: "Blocks Built With Shadcn & Tailwind",
  description:
    "Finely crafted components built with React, Tailwind and shadcn/ui. Developers can copy and paste these blocks directly into their project.",
  buttons: {
    primary: {
      text: "Browse Components",
      url: "https://shadcnblocks.com",
    },
    secondary: {
      text: "View GitHub",
      url: "https://shadcnblocks.com",
    },
  },
  image: {
    src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/saas-hero/saas-hero-1-16x9.png",
    srcDark:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/saas-hero/saas-hero-1-16x9-dark.png",
    alt: "Hero Image Placeholder",
  },
  byline: "Trusted by 25,000+ businesses worldwide",
  icon: <Wifi className="size-6" />,
};

const lightWaveColors = ["#c7d2fe", "#ddd6fe", "#bfdbfe", "#e9d5ff", "#bae6fd"];

const darkWaveColors = ["#38bdf8", "#818cf8", "#c084fc", "#e879f9", "#22d3ee"];

const emptySubscribe = () => () => {};

const Hero115 = (props: Props) => {
  const { icon, heading, description, buttons, image, byline, className } = {
    ...defaultProps,
    ...props,
  };
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const isDark = resolvedTheme === "dark";
  const backgroundFill = isDark ? "oklch(0.145 0 0)" : "oklch(1 0 0)";
  const themeReady = mounted && resolvedTheme !== undefined;

  const desktopImageClassName =
    "mx-auto aspect-3/4 h-full max-h-[524px] w-full max-w-5xl rounded-lg border border-border object-cover object-top-left md:aspect-video md:object-top";
  const mobileImageClassName =
    "mx-auto h-auto w-full max-w-5xl rounded-lg border border-border md:hidden";

  const heroContent = (
    <div className="container mx-auto">
      <div className="flex flex-col gap-5">
        <div className="relative isolate flex flex-col gap-5">
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 -z-10 mx-auto size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border mask-[linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] p-16 [-webkit-mask-image:linear-gradient(to_top,transparent,transparent,white,white,white,transparent,transparent)] md:size-[1300px] md:p-32"
          >
            <div className="size-full rounded-full border border-border p-16 md:p-32">
              <div className="size-full rounded-full border border-border" />
            </div>
          </div>
          <span className="mx-auto flex size-16 items-center justify-center rounded-full border md:size-20">
            {icon}
          </span>
          <h1 className="mx-auto max-w-xl text-center text-4xl font-semibold tracking-tight text-pretty md:text-5xl lg:max-w-3xl lg:text-6xl">
            {heading}
          </h1>
          <p className="mx-auto max-w-5xl text-center text-lg text-balance text-muted-foreground md:text-xl">
            {description}
          </p>
          <div className="flex flex-col items-center gap-3 pt-3 pb-12">
            {buttons?.primary && (
              <HoverBorderGradient
                as="button"
                className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2"
              >
                <a
                  href={buttons.primary.url}
                  className="flex items-center gap-2"
                >
                  {buttons.primary.text}
                  <ArrowRight className="size-4" />
                </a>
              </HoverBorderGradient>
            )}
            {byline && (
              <div className="text-center text-sm text-muted-foreground">
                {byline}
              </div>
            )}
          </div>
        </div>
        {image.srcMobile && (
          /* eslint-disable-next-line @next/next/no-img-element -- shadcnblocks hero uses external CDN images */
          <img
            src={image.srcMobile}
            alt={image.alt}
            className={mobileImageClassName}
          />
        )}
        {image.srcDark ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- shadcnblocks hero uses external CDN images */}
            <img
              src={image.src}
              alt={image.alt}
              className={cn(
                desktopImageClassName,
                "dark:hidden",
                image.srcMobile && "hidden md:block"
              )}
            />
            {/* eslint-disable-next-line @next/next/no-img-element -- shadcnblocks hero uses external CDN images */}
            <img
              src={image.srcDark}
              alt={image.alt}
              className={cn(desktopImageClassName, "hidden md:dark:block")}
            />
          </>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element -- shadcnblocks hero uses external CDN images */
          <img
            src={image.src}
            alt={image.alt}
            className={cn(
              desktopImageClassName,
              image.srcMobile && "hidden md:block"
            )}
          />
        )}
      </div>
    </div>
  );

  return (
    <section className={cn("overflow-hidden", className)}>
      {themeReady ? (
        <WavyBackground
          key={resolvedTheme}
          backgroundFill={backgroundFill}
          blur={10}
          className="relative z-10 w-full"
          colors={isDark ? darkWaveColors : lightWaveColors}
          containerClassName="relative !h-auto min-h-0 w-full !flex-none !justify-start py-32"
          speed="slow"
          waveOpacity={isDark ? 0.45 : 0.35}
          waveYPosition={0.58}
        >
          {heroContent}
        </WavyBackground>
      ) : (
        <div className="py-32">{heroContent}</div>
      )}
    </section>
  );
};

export { Hero115 };
