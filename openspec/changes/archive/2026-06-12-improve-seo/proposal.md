## Why

Parrot currently exposes only minimal HTML metadata (title and description). Social share previews show no image, duplicate title suffixes (`… | Parrot`), and there is no `robots.txt` or sitemap for crawlers. That limits discoverability for the language-shadowing product and produces poor link previews when the landing page is shared.

## What Changes

- Add a shared SEO metadata module with site-wide defaults (title template, description, canonical base URL via `metadataBase`)
- Add Open Graph and Twitter Card tags for the public landing page, including a dedicated share image (1200×630)
- Fix landing page title so it does not double-append the root layout template suffix
- Add `robots.txt` and `sitemap.xml` for public indexable routes (`/`, `/signin`, `/signup`)
- Add JSON-LD structured data on the landing page (`WebSite` / `SoftwareApplication`)
- Keep `/` statically generated (`force-static`); SEO assets are build-time or static files only
- Add `NEXT_PUBLIC_APP_URL` (or equivalent) to `.env.example` for absolute URLs in production

## Capabilities

### New Capabilities

- `site-seo`: Site-wide SEO infrastructure — metadata defaults, robots, sitemap, canonical base URL, and reusable helpers for Open Graph / Twitter tags

### Modified Capabilities

- `learner-landing`: Extend landing page metadata requirements to include social share tags, share image, and structured data; clarify title format

## Impact

- **Routes / app:** `src/app/layout.tsx`, `src/app/(marketing)/page.tsx`, new `src/app/robots.ts`, `src/app/sitemap.ts`
- **Lib:** New `src/lib/seo/` (or similar) for shared metadata constants and helpers
- **Assets:** New `public/og-image.png` (or generated static OG image route) for social previews
- **Env:** `NEXT_PUBLIC_APP_URL` in `.env.example` and validated in `src/lib/env.ts` (client-safe)
- **Dependencies:** None (uses Next.js built-in Metadata API)
- **CMS / jobs / storage:** No changes
