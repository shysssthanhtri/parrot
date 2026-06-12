## Why

Parrot's public auth flows are split between a custom signup page and Auth.js's default sign-in UI at `/api/auth/signin`. The built-in page looks generic, cannot match the product brand, and creates an inconsistent experience next to the existing `/signup` page. Replacing both with paired shadcn blocks (`login-03` / `signup-03`) gives learners a cohesive, branded sign-in and sign-up experience without changing the underlying Auth.js providers or registration logic.

## What Changes

- Add a custom sign-in page at `/signin` using the shadcn `login-03` block (Google OAuth + email/password, muted background, brand header)
- Replace the current `/signup` UI with the shadcn `signup-03` block while preserving the existing server action, validation, and post-signup redirect to `/learn`
- Wire Google and credentials flows to existing Auth.js providers (`signIn("google")`, `signIn("credentials")`) via client components and server actions
- Update `ROUTES.PUBLIC.SIGNIN` from `/api/auth/signin` to `/signin` and update all redirects, links, and CMS auth gates that reference the old route
- Configure Auth.js `pages.signIn` to point at `/signin` so unauthorized CMS redirects land on the custom page
- Redirect authenticated users away from `/signin` and `/signup` to the learner space at `/learn`
- **BREAKING**: `/api/auth/signin` is no longer the user-facing sign-in entry point; bookmarks to it may still work via Auth.js but app links use `/signin`
- Remove or replace legacy signup form components superseded by the new block-based layout

## Capabilities

### New Capabilities

_None — this change upgrades existing auth UI and routes; no new product capabilities._

### Modified Capabilities

- `credentials-auth`: Replace the requirement that sign-in uses the Auth.js built-in page with a custom `/signin` page using shadcn `login-03`; redirect authenticated visitors to `/learn`
- `user-signup`: Update signup page layout/UI requirements to use shadcn `signup-03` (muted background, brand header, social-first pattern); redirect authenticated visitors to `/learn`; preserve existing registration, validation, and navigation requirements

## Impact

- **UI**: New `src/app/signin/` route and components from `@shadcn/login-03`; refactor `src/app/signup/` to `@shadcn/signup-03` layout; shared auth chrome (brand link, terms footer) where duplicated
- **Auth**: `src/auth.ts` — add `pages: { signIn: "/signin" }`; sign-in server action calling `signIn("credentials", …)` with redirect to `/learn`
- **Routes**: `src/app/configs/routes.ts` — `ROUTES.PUBLIC.SIGNIN` → `/signin`; `signInUrl()` helper unchanged in behavior
- **Redirects**: CMS `authorized` callback, `src/app/learn/layout.tsx`, landing CTAs, cross-links between sign-in and sign-up, and authenticated-user redirects from `/signin` and `/signup` to `/learn`
- **Dependencies**: shadcn CLI add for `@shadcn/login-03` and `@shadcn/signup-03` (may pull block form components; avoid overwriting customized UI primitives unless intentional)
- **Unchanged**: Prisma schema, Auth.js providers, signup server action logic, CMS authorization model, learner landing static page behavior
