## 1. Environment and shared SEO module

- [x] 1.1 Add `NEXT_PUBLIC_APP_URL` to `.env.example` with production example (`https://parrot.shyss.space`)
- [x] 1.2 Extend `src/lib/env.ts` to validate `NEXT_PUBLIC_APP_URL` via `experimental__runtimeEnv` (optional URL, dev fallback)
- [x] 1.3 Create `src/lib/seo/site.ts` with site name, default description, public sitemap routes, and `getSiteUrl()` helper

## 2. Root layout metadata

- [x] 2.1 Update `src/app/layout.tsx` to set `metadataBase`, default description, Open Graph site name, and Twitter `summary_large_image` defaults using `src/lib/seo/site.ts`

## 3. Share image asset

- [x] 3.1 Add `public/og-image.png` (1200×630) using Parrot branding for social link previews

## 4. Landing page SEO

- [x] 4.1 Extend `src/app/(marketing)/page.tsx` metadata with `openGraph` and `twitter` blocks; use `title.absolute` to prevent duplicate `| Parrot` suffix
- [x] 4.2 Add JSON-LD structured data component (e.g. `src/components/json-ld.tsx` or inline in landing page) for WebSite/SoftwareApplication schema
- [x] 4.3 Confirm `export const dynamic = "force-static"` remains on the landing page

## 5. Crawler routes

- [x] 5.1 Add `src/app/robots.ts` disallowing `/cms`, `/learn`, `/api` and referencing sitemap URL
- [x] 5.2 Add `src/app/sitemap.ts` with static entries for `/`, `/signin`, and `/signup`
