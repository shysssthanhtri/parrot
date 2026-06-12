## Context

Parrot uses Auth.js (NextAuth v5) with Google OAuth and a Credentials provider. Self-service signup exists at `/signup` with a custom shadcn card form and server action (`src/app/signup/actions.ts`). Sign-in still uses Auth.js's built-in page at `/api/auth/signin`, which is styled differently and cannot carry Parrot branding. CMS routes redirect unauthenticated users to `ROUTES.PUBLIC.SIGNIN`; learner routes gate at `/learn` and redirect guests to sign-in with `callbackUrl=/learn`.

The shadcn registry provides paired blocks `login-03` and `signup-03`: muted full-viewport background, centered brand header, card form, social OAuth buttons first, email/password below a separator, and footer links between flows.

## Goals / Non-Goals

**Goals:**

- Custom `/signin` page using `@shadcn/login-03`, wired to Google OAuth and credentials sign-in
- Refactor `/signup` to `@shadcn/signup-03` layout while keeping existing registration logic and `/learn` redirect
- Unified visual language between sign-in and sign-up (brand header, muted shell, cross-links)
- Point `ROUTES.PUBLIC.SIGNIN`, Auth.js `pages.signIn`, and CMS/learn redirects at `/signin`
- Redirect authenticated users from `/signin` and `/signup` to `/learn` (mirror learner layout gate in reverse)

**Non-Goals:**

- Password reset / forgot-password flow (block includes placeholder link; hide or leave inert for v1)
- Apple or Meta OAuth (block templates include extra providers; only Google is configured)
- Collecting full name on signup (signup-03 template includes name field; omit unless product requires it)
- Changing Auth.js providers, session strategy, or CMS authorization rules
- Custom sign-in for CMS-only operators beyond the shared public page

## Decisions

### 1. Install blocks via shadcn CLI without overwriting UI primitives

**Choice:** Run `npx shadcn@latest add @shadcn/login-03 @shadcn/signup-03 -y` without `--overwrite`. Move generated files into route-scoped folders (`src/app/signin/`, `src/app/signup/`) and delete generic paths (`src/app/login/page.tsx`, root-level `login-form.tsx`) if the CLI creates them.

**Rationale:** The project already customizes `field`, `button`, etc. Overwriting risks regressions. Blocks are mostly page + form components that import existing `@/components/ui/*`.

**Alternatives considered:**

- Manual copy from shadcn docs — more drift from registry updates
- `--overwrite` all UI — unnecessary churn

### 2. Sign-in route at `/signin` with Auth.js `pages.signIn`

**Choice:** Add `src/app/signin/page.tsx` and set in `src/auth.ts`:

```ts
pages: {
  signIn: "/signin";
}
```

Update `ROUTES.PUBLIC.SIGNIN` to `"/signin"`. Keep `signInUrl(callbackUrl)` building query params for post-auth redirect.

**Rationale:** Clean public URL, matches signup at `/signup`, and Auth.js unauthorized redirects use the custom page automatically.

**Alternatives considered:**

- Keep `/api/auth/signin` as canonical — rejected; user explicitly wants custom pages
- Single combined auth page with tabs — rejected; blocks are separate pages

### 3. Credentials sign-in via server action (mirror signup pattern)

**Choice:** Add `src/app/signin/actions.ts` with a server action that validates email/password with Zod and calls `signIn("credentials", { email, password, redirectTo })` from `@/auth`. Form uses `useActionState` like signup.

**Rationale:** Consistent with existing signup server action; keeps secrets server-side; enables field-level errors on the custom form instead of Auth.js redirect errors.

**Alternatives considered:**

- Client-only `signIn` from `next-auth/react` — works but splits patterns; server action preferred for credentials POST
- POST directly to `/api/auth/callback/credentials` — lower-level, harder to surface validation UX

### 4. Google OAuth via client button components

**Choice:** Reuse/extract a shared `GoogleAuthButton` client component calling `signIn("google", { callbackUrl })` with `ROUTES.LEARN.HOME` for learner flows and honoring `callbackUrl` search param on sign-in when present.

**Rationale:** OAuth requires client redirect; signup already uses this pattern in `google-signup-button.tsx`.

### 5. Shared auth shell component

**Choice:** Extract `AuthPageShell` under `src/app/(auth)/_components/` or `src/components/auth/` with brand link to `/`, muted layout wrapper, and optional terms footer — used by both `/signin` and `/signup` pages.

**Rationale:** login-03 and signup-03 share identical outer chrome; DRY without merging forms.

### 6. Signup block adaptations

**Choice:** Adapt signup-03 form to:

- Drop full-name field (not in current schema or server action)
- Keep email, password, confirm password side-by-side layout from block
- Wire submit to existing `signup` server action
- Add Google button above credentials (login-03 pattern) using `FieldSeparator` — signup-03 block is credentials-only; add Google row to match sign-in parity per existing spec
- Link "Sign in" to `signInUrl()`

**Rationale:** Preserves all `user-signup` behavioral requirements while adopting block styling.

### 7. Error handling for sign-in

**Choice:** Map Auth.js `CredentialsSignin` to a generic form error ("Invalid email or password") without revealing account existence. Support `?error=` query param from Auth.js redirects as fallback banner on page load.

**Rationale:** Matches security posture of built-in Auth.js page.

### 8. Authenticated-user redirect on auth pages

**Choice:** In both `src/app/signin/page.tsx` and `src/app/signup/page.tsx`, call `auth()` server-side and `redirect(ROUTES.LEARN.HOME)` when a session exists. Optionally extract a shared `(auth)/layout.tsx` guard if both routes share a route group.

**Rationale:** Signed-in users should not see sign-in/sign-up forms; `/learn` is the default post-auth destination and matches existing signup/sign-in callback behavior.

**Alternatives considered:**

- Client-side redirect after hydration — slower, flashes auth UI
- Allow access but hide forms — confusing UX

## Risks / Trade-offs

- **[shadcn CLI path defaults]** → CLI may create `/login` instead of `/signin`; relocate files and adjust imports manually
- **[Stale bookmarks to `/api/auth/signin`]** → Auth.js route still exists for OAuth callbacks; user-facing links all move to `/signin`
- **[Block includes Apple OAuth UI]** → Omit Apple button or hide until provider exists; show Google only
- **[signup-03 lacks Google in template]** → Add social section manually to meet existing `user-signup` spec
- **[Forgot password link in login-03]** → Hide or disable until reset flow exists

## Migration Plan

1. Add shadcn blocks and scaffold `/signin` + refactor `/signup` components
2. Implement sign-in server action and wire forms
3. Update `routes.ts`, `auth.ts`, learn layout, CMS redirects, and cross-links
4. Remove obsolete signup components (`signup-form.tsx` card layout, etc.) after parity verified
5. Smoke test: credentials sign-in/up, Google OAuth, CMS redirect to `/signin`, learner gate with callback, duplicate email signup

**Rollback:** Revert `ROUTES.PUBLIC.SIGNIN` to `/api/auth/signin`, remove `pages.signIn`, restore previous signup components.

## Open Questions

- Terms of Service / Privacy Policy links in block footer: use placeholder `#` or omit until legal pages exist? **Default: omit links or hide footer until URLs are defined.**
