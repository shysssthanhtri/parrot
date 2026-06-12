## Why

Parrot's public home page (`/`) is a placeholder with only sign-in and sign-up buttons. End-user learners have no marketing entry point explaining shadowing, and no dedicated post-auth destination after registration or sign-in. Speech publishing and learner APIs exist on the backend, but the product lacks a learner-facing surface to acquire and orient new users.

## What Changes

- Replace `/` with a learner-focused marketing landing page: site header, hero (headline, subheadline, CTAs), and a static "How it works" section
- Add authenticated learner space at `/learn` with a public layout (header, sign-out) and v1 empty/welcome state (catalog UI deferred)
- Redirect signed-in users from `/` to `/learn`
- Update post-signup and post-sign-in flows to land on `/learn` instead of `/`
- Add route constants for learner routes and post-auth callback URL
- Update root metadata (title, description) for Parrot
- Register `@shadcnblocks` in `components.json` and install free **Hero 115** block as the landing hero (customized copy for shadowing)

## Capabilities

### New Capabilities

- `learner-landing`: Public marketing landing page at `/` for end-user learners (hero, how-it-works, auth CTAs, signed-in redirect)
- `learner-space`: Authenticated learner home at `/learn` (auth gate, layout shell, v1 welcome/empty state)

### Modified Capabilities

- `user-signup`: Post-signup redirect target changes from `/` to `/learn`; home page auth entry points remain on landing

## Impact

- **Routes**: `src/app/page.tsx`, new `(marketing)` or public layout, new `src/app/learn/` tree
- **Config**: `src/app/configs/routes.ts`, `components.json` (shadcnblocks registry)
- **Auth**: `src/app/signup/actions.ts`, `src/app/signup/_components/google-signup-button.tsx`, sign-in links with `callbackUrl=/learn`; optional `auth.ts` default callback
- **Metadata**: `src/app/layout.tsx` or landing-specific metadata
- **Specs**: New `openspec/specs/learner-landing/` and `openspec/specs/learner-space/` after archive; delta to `user-signup`
- **Dependencies**: `@shadcnblocks/hero115` via shadcn CLI (no npm package; copied source)
- **CMS**: Unchanged; operators continue using `/cms` directly
- **APIs**: No new tRPC procedures; catalog wiring is a follow-up change
