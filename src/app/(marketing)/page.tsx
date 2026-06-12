import { Mic } from "lucide-react";
import type { Metadata } from "next";

import { ROUTES } from "@/app/configs/routes";
import { Hero115 } from "@/components/hero115";

import { HowItWorks } from "./_components/how-it-works";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Parrot — Language shadowing practice",
  description:
    "Learn languages by shadowing native speakers. Browse speeches, listen along, and practice out loud with Parrot.",
};

export default function LandingPage() {
  return (
    <>
      <Hero115
        icon={<Mic className="size-6" />}
        heading="Learn languages by shadowing native speakers"
        description="Parrot helps you practice pronunciation and rhythm by listening to real speeches and speaking along — one sentence at a time."
        buttons={{
          primary: {
            text: "Get started free",
            url: ROUTES.LEARN.HOME,
          },
        }}
        byline={undefined}
        image={{
          src: "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/saas-hero/saas-hero-1-16x9.png",
          srcDark:
            "https://deifkwefumgah.cloudfront.net/shadcnblocks/image-set/modern/saas-hero/saas-hero-1-16x9-dark.png",
          alt: "Language learner practicing shadowing with Parrot",
        }}
      />
      <HowItWorks />
    </>
  );
}
