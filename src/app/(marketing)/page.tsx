import { Mic } from "lucide-react";
import type { Metadata } from "next";

import { ROUTES } from "@/app/configs/routes";
import { Hero115 } from "@/components/hero115";
import { JsonLd } from "@/components/json-ld";
import {
  getSiteUrl,
  LANDING_DESCRIPTION,
  LANDING_HERO_MOBILE_IMAGE_PATH,
  LANDING_TITLE,
  OG_IMAGE_PATH,
  SITE_NAME,
} from "@/lib/seo/site";

import { HowItWorks } from "./_components/how-it-works";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: {
    absolute: LANDING_TITLE,
  },
  description: LANDING_DESCRIPTION,
  openGraph: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630 }],
  },
  twitter: {
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [OG_IMAGE_PATH],
  },
};

const landingStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: getSiteUrl(),
      description: LANDING_DESCRIPTION,
    },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: getSiteUrl(),
      description: LANDING_DESCRIPTION,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <JsonLd data={landingStructuredData} />
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
          src: OG_IMAGE_PATH,
          srcMobile: LANDING_HERO_MOBILE_IMAGE_PATH,
          alt: "Language learner practicing shadowing with Parrot",
        }}
      />
      <HowItWorks />
    </>
  );
}
