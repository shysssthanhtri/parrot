## Context

The learner landing page at `/` lives in the `(marketing)` route group. Both `layout.tsx` and `page.tsx` currently call `auth()`, and `SiteHeader` renders session-dependent controls (Sign in / Sign up / Sign out). That forces dynamic rendering even though hero copy, how-it-works content, and metadata are identical for every visitor.

The `/learn` route already auth-gates in its layout and redirects unauthenticated users to sign-in with `callbackUrl=/learn`. A static header link to `/learn` preserves the auth funnel without dynamic landing markup.

## Goals / Non-Goals

**Goals:**

- Prerender `/` as static HTML at build time
- Replace marketing header auth controls with a single **Go to learner space** button → `ROUTES.LEARN.HOME`
- Use a static hero primary CTA (**Get started free** → `/signup`)
- Keep `/learn` authenticated with sign-out available in the learner shell

**Non-Goals:**

- Changing `/learn` auth behavior or post-signup redirect targets
- Adding middleware or edge auth for `/`
- Revisiting how-it-works content or hero imagery
- CMS or signup flow changes

## Decisions

### 1. Remove dynamic APIs from `(marketing)` route group

**Choice:** Delete `auth()` and `SessionProvider` from `src/app/(marketing)/layout.tsx`. Remove `auth()` from `src/app/(marketing)/page.tsx`. Add `export const dynamic = "force-static"` on the landing page (and marketing layout if needed) to make intent explicit.

**Rationale:** Any `auth()` call opts the route into dynamic rendering. Removing session access is the minimal path to static output.

**Alternatives considered:**

- Keep layout dynamic but static page only — rejected; layout auth still forces dynamic subtree.
- Client-side session check in header — rejected; contradicts static goal and still shifts work to the client.

### 2. Split marketing header from learner header

**Choice:** Replace auth-aware `SiteHeader` in marketing with a static `LandingHeader` component (brand link + **Go to learner space** button). Introduce `LearnHeader` (or rename existing header) for `src/app/learn/layout.tsx` with brand + sign-out via existing `SiteSignOutButton`.

**Rationale:** Learn layout still needs sign-out; marketing must stay session-free. Sharing one auth-aware header couples both surfaces.

**Alternatives considered:**

- Single header with optional `variant` prop — acceptable; split files keep marketing tree free of auth imports.
- Inline header markup in layout — rejected; components already exist under `_components/`.

### 3. Static hero CTA

**Choice:** Hero primary button always **Get started free** linking to `ROUTES.PUBLIC.SIGNUP`.

**Rationale:** Header already exposes learner-space entry; hero remains acquisition-focused. Avoids duplicating the same CTA twice above the fold.

**Alternatives considered:**

- Hero also **Go to learner space** — rejected unless product wants duplicate CTAs; user specified header only.

### 4. Signed-in users may view `/`

**Choice:** No redirect from `/` based on session (consistent with current archived spec). Static HTML is the same for all users.

**Rationale:** Aligns with existing `learner-landing` requirement that signed-in users may view landing without redirect.

## Risks / Trade-offs

- **[Signed-in users lose quick sign-out on landing]** → Sign-out remains on `/learn`; landing is acquisition-only.
- **[Unauthenticated header click hits auth gate]** → Expected; `/learn` layout redirects to sign-in with `/learn` callback.
- **[Learn layout header drift from marketing brand]** → Share brand link + container styles; only nav actions differ.

## Migration Plan

1. Add static `LandingHeader`; wire into `(marketing)/layout.tsx` without auth/session
2. Add `LearnHeader` (or refactor `SiteHeader`) for learn layout with sign-out
3. Simplify landing `page.tsx`: remove `auth()`, static hero props, add `force-static`
4. Remove unused auth imports from marketing components; delete or relocate `SiteSignOutButton` usage
5. Verify build output: `/` is static; `/learn` still redirects guests to sign-in
6. Archive spec delta to update `openspec/specs/learner-landing/spec.md`

**Rollback:** Restore auth-aware `SiteHeader` in marketing layout and page; remove `force-static`.

## Open Questions

None.
