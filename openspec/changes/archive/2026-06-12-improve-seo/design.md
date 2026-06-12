## Context

Parrot's root layout (`src/app/layout.tsx`) exports minimal `Metadata`: a title template (`%s | Parrot`) and a generic description. The marketing landing page (`src/app/(marketing)/page.tsx`) adds its own title and description but no Open Graph, Twitter, or canonical tags. There is no `metadataBase`, so relative OG image paths would not resolve to absolute URLs for crawlers. Social preview tools (e.g. Facebook, LinkedIn) report a missing share image for `parrot.shyss.space`.

The landing page is already static (`export const dynamic = "force-static"`). SEO work must preserve that constraint — no per-request auth or database calls for metadata.

There is no `NEXT_PUBLIC_APP_URL` today; production hostname is known at deploy time (`parrot.shyss.space`).

## Goals / Non-Goals

**Goals:**

- Provide complete metadata for `/` so link previews show title, description, and a branded image
- Establish site-wide SEO defaults in root layout (`metadataBase`, title template, default OG/Twitter site tags)
- Expose `robots.txt` and `sitemap.xml` listing public marketing/auth entry routes
- Add JSON-LD on the landing page for search engines
- Keep landing page statically prerendered

**Non-Goals:**

- SEO for authenticated routes (`/learn`, `/cms`) — these should remain non-indexable
- Dynamic OG images per speech or CMS content
- Blog, FAQ, or additional marketing pages
- Analytics / Search Console verification tags (can follow later)
- i18n / hreflang

## Decisions

### 1. Centralize SEO constants in `src/lib/seo/site.ts`

**Choice:** Create a small module exporting site name, default description, public routes list, and a `getSiteUrl()` helper reading `NEXT_PUBLIC_APP_URL` (fallback `http://localhost:3000` in dev).

**Rationale:** Single source of truth for sitemap, robots, metadata, and JSON-LD. Avoids duplicated strings across layout, page, and route handlers.

**Alternatives considered:**

- Inline constants in each file — rejected; drift risk.
- Server-only env for URL — rejected; Next.js metadata and sitemap run at build/edge and benefit from a client-safe public URL.

### 2. Set `metadataBase` in root layout

**Choice:** Add `metadataBase: new URL(getSiteUrl())` and expanded defaults in `src/app/layout.tsx`: `openGraph.siteName`, `twitter.card: "summary_large_image"`, default description, and `robots` index/follow for public pages.

**Rationale:** Next.js resolves relative OG image paths against `metadataBase`. Required for social crawlers to fetch images.

**Alternatives considered:**

- Hardcode production URL — rejected; breaks local/staging previews.

### 3. Landing page metadata via Next.js `Metadata` export

**Choice:** Extend `src/app/(marketing)/page.tsx` metadata with `openGraph` and `twitter` blocks. Use `title: { absolute: "Parrot — Language shadowing practice" }` to avoid double suffix from root template. Set `openGraph.images` to `/og-image.png`.

**Rationale:** Declarative Metadata API is the Next.js 16 standard; stays compatible with static generation.

**Alternatives considered:**

- `generateMetadata` async function — unnecessary; all values are static.
- Dynamic OG route (`opengraph-image.tsx`) — acceptable but adds complexity; static PNG in `public/` is simpler for a single landing page.

### 4. Static OG image in `public/og-image.png`

**Choice:** Add a 1200×630 PNG using existing Parrot branding (`public/logo-with-text.png` or similar). Served from `/og-image.png`.

**Rationale:** Social platforms require absolute HTTPS URLs and recommended 1200×630 dimensions. Static file requires no runtime generation.

**Alternatives considered:**

- `app/opengraph-image.tsx` ImageResponse — more flexible but overkill for v1.
- Remote CDN hero image — rejected; external URL adds dependency and may not meet OG size guidelines.

### 5. `robots.ts` and `sitemap.ts` via Next.js Metadata Route handlers

**Choice:**

- `src/app/robots.ts` — allow `/`, disallow `/cms`, `/learn`, `/api`; reference sitemap URL.
- `src/app/sitemap.ts` — static entries for `/`, `/signin`, `/signup` with `lastModified` at build time.

**Rationale:** Built-in Next.js pattern; no manual XML files; automatically served at `/robots.txt` and `/sitemap.xml`.

**Alternatives considered:**

- Static files in `public/` — rejected; sitemap URL must reflect `metadataBase` / production hostname.

### 6. JSON-LD via inline `<script type="application/ld+json">` in landing page

**Choice:** Add a small `JsonLd` component or inline script in the landing page with `@type: WebSite` and `SoftwareApplication` (or `WebApplication`) schema including name, url, description.

**Rationale:** Google recommends JSON-LD; static content fits landing page. No extra dependency.

**Alternatives considered:**

- `next/script` with external schema.org lib — rejected; JSON is trivial.

### 7. Environment variable `NEXT_PUBLIC_APP_URL`

**Choice:** Add to `.env.example` and `src/lib/env.ts` with Zod URL validation, defaulting to `http://localhost:3000` when unset in development.

**Rationale:** Required for correct absolute URLs in production (`https://parrot.shyss.space`). Must be set in Vercel project env.

## Risks / Trade-offs

- **[Missing env in production]** → OG/sitemap URLs may point to localhost → document in `.env.example`; fail loudly in build if possible, or default with comment in README.
- **[OG image quality]** → Hand-crafted PNG may look generic → use existing logo assets; can iterate design later without code changes.
- **[Over-indexing auth/CMS routes]** → robots disallow mitigates; authenticated pages should also set `robots: { index: false }` in their layouts (follow-up if not present).
- **[Title template conflicts]** → Use `absolute` title on pages that define full titles → document pattern in `site.ts` helper.

## Migration Plan

1. Add `NEXT_PUBLIC_APP_URL` to `.env.example` and env schema; set in Vercel for production
2. Create `src/lib/seo/site.ts` with constants and URL helper
3. Update root `layout.tsx` with `metadataBase` and default OG/Twitter
4. Add `public/og-image.png`
5. Extend landing page metadata and JSON-LD; keep `force-static`
6. Add `robots.ts` and `sitemap.ts`
7. Verify with social preview debugger and `curl` on `/robots.txt`, `/sitemap.xml`

**Rollback:** Revert metadata exports and delete new files; no database or API changes.

## Open Questions

None.
