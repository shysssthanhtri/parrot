## 1. Static marketing header

- [x] 1.1 Create `LandingHeader` in `src/app/(marketing)/_components/landing-header.tsx` with brand link and **Go to learner space** button linking to `ROUTES.LEARN.HOME`
- [x] 1.2 Update `src/app/(marketing)/layout.tsx` to use `LandingHeader`, remove `auth()` and `SessionProvider`

## 2. Learner layout header

- [x] 2.1 Create `LearnHeader` in `src/app/learn/_components/learn-header.tsx` (or refactor `site-header.tsx`) with brand link and `SiteSignOutButton`
- [x] 2.2 Update `src/app/learn/layout.tsx` to use `LearnHeader` instead of marketing `SiteHeader`

## 3. Static landing page

- [x] 3.1 Remove `auth()` from `src/app/(marketing)/page.tsx` and use static hero props: primary CTA **Get started free** → `ROUTES.PUBLIC.SIGNUP`
- [x] 3.2 Add `export const dynamic = "force-static"` to the marketing landing page (and layout if required)

## 4. Cleanup

- [x] 4.1 Remove or stop exporting unused auth-aware `SiteHeader` if fully replaced by `LandingHeader` and `LearnHeader`
