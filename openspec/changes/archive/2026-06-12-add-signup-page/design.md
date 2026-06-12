## Context

Parrot uses Next.js App Router with Auth.js (NextAuth v5), Google OAuth, and a Credentials provider. Sign-in is served by the Auth.js built-in page at `/api/auth/signin` (referenced as `ROUTES.PUBLIC.SIGNIN`). Credentials users are currently provisioned only via seed/SQL; there is no self-service registration UI.

The public home page (`/`) links to sign-in. CMS routes redirect unauthenticated users to `/api/auth/signin`. New users default to `isCmsUser = false` per `cms-user-auth` spec.

## Goals / Non-Goals

**Goals:**

- Add a public signup page at `/signup` with UI consistent with the sign-in experience (centered layout, shadcn components, Google + credentials options)
- Allow self-service registration with email and password (bcrypt hash stored on `User`)
- Sign the user in automatically after successful signup
- Link signup and sign-in pages for navigation between flows
- Default new sign-ups to non-CMS (`is_cms_user = false`)

**Non-Goals:**

- Custom sign-in page replacement (keep Auth.js built-in at `/api/auth/signin`)
- Email verification or password reset
- Account linking (Google + credentials on same email)
- CMS self-service access (operators still grant `is_cms_user` manually)
- Rate limiting or CAPTCHA (follow-up hardening)

## Decisions

### 1. Signup route at `/signup`

**Choice:** Public App Router page at `src/app/signup/page.tsx`, registered as `ROUTES.PUBLIC.SIGNUP = "/signup"`.

**Rationale:** Mirrors the public auth entry pattern (`/api/auth/signin` for sign-in, `/signup` for registration). Auth.js has no built-in signup page, so a dedicated app route is the standard approach. Keeps sign-in on the existing Auth.js page without migration risk.

**Alternatives considered:**

- `/api/auth/signup` — conflates page UI with API route namespace; rejected.
- Replace sign-in with custom `/signin` — out of scope; user asked for signup only.

### 2. Shared auth layout components

**Choice:** Extract reusable auth shell components under `src/app/signup/_components/` (or `src/components/auth/` if reused from sign-in links). Use the same centered `main` layout as `/forbidden`, shadcn `Card`, `Input`, `Label`, and `Button`.

**Rationale:** Ensures visual consistency with existing public pages and CMS design system. Sign-in remains Auth.js default styling; signup uses project shadcn theme for a polished first-party page.

### 3. Server Action for registration

**Choice:** Implement signup as a Next.js Server Action in `src/app/signup/actions.ts` that:

1. Validates input with Zod (`email`, `password`, `confirmPassword` with match check, minimum password length)
2. Checks for existing email — return generic field error without revealing existence on sign-in path; on signup, "email already registered" is acceptable
3. `prisma.user.create` with `bcrypt.hash(password, 12)` → `passwordHash`, `isCmsUser: false`
4. Calls `signIn("credentials", { email, password, redirectTo: "/" })` on success

**Rationale:** Server Actions keep secrets server-side, align with App Router patterns, and reuse existing Credentials provider for post-signup session without duplicating JWT logic.

**Alternatives considered:**

- tRPC mutation — no existing public auth router; Server Action is simpler for a single form.
- REST route handler — equivalent but more boilerplate than Server Action.

### 4. Google OAuth on signup page

**Choice:** Render a "Sign up with Google" button that calls `signIn("google", { callbackUrl: "/" })` via a small client component, same as would appear on sign-in.

**Rationale:** Google OAuth already creates users on first sign-in with `isCmsUser = false`. Offering Google on signup matches user expectation and the dual-provider sign-in page.

### 5. Cross-links between auth pages

**Choice:** Signup page shows "Already have an account? Sign in" linking to `ROUTES.PUBLIC.SIGNIN`. Add a reciprocal link on the Auth.js sign-in page via Auth.js `pages` config or a note in home page — Auth.js built-in page supports limited customization; add link via `src/auth.ts` custom sign-in page message if needed, or document adding text via Auth.js theme. **Pragmatic v1:** Link from `/signup` to sign-in; update home page with both buttons; optionally configure Auth.js `pages.signIn` later.

**Update:** Auth.js v5 allows passing custom sign-in page URL. For reciprocal link, add a small banner or use Auth.js `signIn` page customization. Simplest v1: home page + signup page links only; add "Don't have an account? Sign up" text via custom pages config pointing sign-in to a wrapper — **keep v1 minimal**: signup links to sign-in; home page shows both entry points.

### 6. Password requirements

**Choice:** Minimum 8 characters; require matching confirm password field on signup form only.

**Rationale:** Basic security without over-engineering. Matches common UX expectations.

### 7. Error handling

**Choice:** Return structured errors from Server Action (`{ error: "email_taken" | "validation" | "unknown" }`). Display user-friendly messages in the form. Do not auto-sign-in on duplicate email.

**Rationale:** Clear signup UX; avoids leaking whether email exists on the sign-in flow (unchanged).

## Risks / Trade-offs

- **[Duplicate email across Google and credentials]** → Same email cannot register with password if Google account exists (Prisma unique on email). Show "email already registered" on signup; document as operator constraint (existing risk from credentials-auth).
- **[No email verification]** → Anyone can register with any email. Acceptable for v1 public site; note for future hardening.
- **[Auth.js sign-in page styling differs from signup]** → Sign-in stays Auth.js default; signup uses shadcn. Mitigated by similar layout structure and cross-links; custom sign-in page is a follow-up.
- **[Brute-force signup spam]** → No rate limiting in v1. Low traffic expected; infra limits can follow.

## Migration Plan

1. Add `ROUTES.PUBLIC.SIGNUP` and signup page with Server Action
2. Update home page with sign-up link
3. Smoke test: new user signs up with email/password → session created → `/` accessible → `/cms/*` redirects to `/forbidden`
4. Smoke test: duplicate email rejected; Google signup still works; existing sign-in unchanged

**Rollback:** Remove signup page and route constant; no database changes to revert.

## Open Questions

None — route, registration mechanism, and CMS defaults are resolved above.
