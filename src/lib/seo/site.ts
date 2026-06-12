import { ROUTES } from "@/app/configs/routes";
import { env } from "@/lib/env";

export const SITE_NAME = "Parrot";

export const SITE_DESCRIPTION =
  "Learn languages by shadowing native speakers with Parrot.";

export const LANDING_TITLE = "Parrot — Language shadowing practice";

export const LANDING_DESCRIPTION =
  "Learn languages by shadowing native speakers. Browse speeches, listen along, and practice out loud with Parrot.";

export const OG_IMAGE_PATH = "/og-image.png";

export const PUBLIC_SITEMAP_ROUTES = [
  ROUTES.PUBLIC.HOME,
  ROUTES.PUBLIC.SIGNIN,
  ROUTES.PUBLIC.SIGNUP,
] as const;

const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): string {
  const url = env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL;
  return url.replace(/\/$/, "");
}
