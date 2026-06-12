## Why

The marketing landing page at `/` currently calls `auth()` in both the page and layout, forcing dynamic server rendering on every request. That adds latency and complexity for a page whose content is identical for all visitors. The header also shows auth-specific controls (Sign in / Sign up / Sign out) that do not match the desired static marketing experience—a single "Go to learner space" entry point is sufficient because `/learn` handles authentication.

## What Changes

- Make `/` fully static: remove `auth()` and session providers from the marketing route group so the page can be prerendered at build time
- Replace landing header auth controls with a static **Go to learner space** button linking to `/learn`
- Simplify the hero primary CTA to static copy (no per-session branching)
- Keep `/learn` auth-gated in its own layout; unauthenticated users who click **Go to learner space** are redirected to sign-in with a `/learn` callback (existing behavior)
- Split or refactor the shared `SiteHeader` so the learner layout retains sign-out while the marketing layout stays static

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `learner-landing`: Landing page SHALL be statically generated; header SHALL show **Go to learner space** instead of sign-in/sign-up/sign-out; hero CTA SHALL not depend on session state

## Impact

- **Routes:** `src/app/(marketing)/page.tsx`, `src/app/(marketing)/layout.tsx`, `src/app/(marketing)/_components/site-header.tsx`
- **Components:** Possible new static `LandingHeader` or header variant; `SiteSignOutButton` may move to learn-only header
- **Learn layout:** `src/app/learn/layout.tsx` may use a separate authenticated header
- **Next.js:** Explicit static rendering (`force-static` or removal of dynamic APIs); improved cacheability of `/`
- **Specs:** Delta update to `openspec/specs/learner-landing/spec.md` (header and static rendering requirements)
