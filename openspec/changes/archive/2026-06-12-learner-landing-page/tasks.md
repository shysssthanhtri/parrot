## 1. Routes and registry

- [x] 1.1 Add `ROUTES.PUBLIC.HOME`, `ROUTES.LEARN.HOME` (`/learn`), and a helper for sign-in URL with `callbackUrl=/learn` in `src/app/configs/routes.ts`
- [x] 1.2 Register `@shadcnblocks` in `components.json` and run `npx shadcn@latest add @shadcnblocks/hero115`

## 2. Shared site header

- [x] 2.1 Create `SiteHeader` component with Parrot brand, sign-in/sign-up links (guest), and sign-out (authenticated) using `ROUTES` constants
- [x] 2.2 Wire sign-in links to use `/learn` as the post-auth callback URL

## 3. Marketing landing page

- [x] 3.1 Add `(marketing)` route group layout with `SiteHeader` in `src/app/(marketing)/layout.tsx`
- [x] 3.2 Replace root landing: create `src/app/(marketing)/page.tsx` (guests and signed-in users may view; signed-in hero CTA links to `/learn`)
- [x] 3.3 Customize installed Hero 115 with Parrot shadowing headline, subheadline, and primary CTA → `/signup`
- [x] 3.4 Add static how-it-works section (three steps) below the hero
- [x] 3.5 Set landing-specific metadata (title, description) for Parrot learners

## 4. Learner space

- [x] 4.1 Create `src/app/learn/layout.tsx` with auth gate (redirect unauthenticated users to sign-in with `callbackUrl=/learn`) and `SiteHeader`
- [x] 4.2 Create `src/app/learn/page.tsx` with v1 welcome copy and empty/coming-soon state for speech catalog

## 5. Auth redirect updates

- [x] 5.1 Update `src/app/signup/actions.ts` post-signup `redirectTo` from `/` to `/learn`
- [x] 5.2 Update `src/app/signup/_components/google-signup-button.tsx` `callbackUrl` to `/learn`
- [x] 5.3 Update signup page sign-in link to include `/learn` callback URL

## 6. Cleanup

- [x] 6.1 Remove obsolete `src/app/page.tsx` if superseded by `(marketing)/page.tsx`; ensure `/` resolves correctly
- [x] 6.2 Update default root metadata in `src/app/layout.tsx` if landing metadata is not fully page-scoped
