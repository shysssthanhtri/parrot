## Context

Parrot's public home page (`/`) is a placeholder with two auth buttons. Sign-up and sign-in redirect to `/` after success. The CMS at `/cms` serves content authors; learner APIs (`speechPublications.list`, `getById`) exist but have no UI. End users need a marketing landing page and an authenticated learner destination after auth.

Existing patterns: shadcn/ui + Tailwind, `(cms)` route group for CMS layout, centered card pattern on `/signup` and `/forbidden`, Auth.js with Google + Credentials, `ROUTES` constants in `src/app/configs/routes.ts`.

## Goals / Non-Goals

**Goals:**

- Ship a learner-focused marketing landing at `/` with hero (shadcnblocks Hero 115), site header, and static how-it-works section
- Add auth-gated learner space at `/learn` with header and v1 welcome state
- Redirect signed-in users from `/` to `/learn`; redirect all post-auth flows to `/learn`
- Update metadata and route constants; customize Hero 115 copy for shadowing

**Non-Goals:**

- Speech catalog UI or shadowing player (follow-up change)
- Custom sign-in page replacement (keep Auth.js at `/api/auth/signin`)
- Role-based redirect (`isCmsUser` → `/cms`); all users land on `/learn` after auth
- CMS layout or navigation changes
- Public (unauthenticated) access to published speeches

## Decisions

### 1. Route structure: `(marketing)` group + `/learn`

**Choice:** Add `src/app/(marketing)/layout.tsx` for landing header/footer shell; `src/app/(marketing)/page.tsx` replaces root `src/app/page.tsx` (or move page into group). Add `src/app/learn/layout.tsx` and `src/app/learn/page.tsx` for learner space.

**Rationale:** Mirrors `(cms)` route group pattern. Keeps marketing chrome separate from CMS sidebar and learner shell.

**Alternatives considered:**

- Single auth-aware `/` without `/learn` — rejected; user explicitly wants post-auth learner space separate from marketing.
- `/speeches` as learner home — rejected; `/learn` is clearer as product home before catalog routes exist.

### 2. Hero block: shadcnblocks Hero 115 (free)

**Choice:** Register `@shadcnblocks` in `components.json` and install `@shadcnblocks/hero115`. Customize headline, description, CTA label/link, and optional hero image placeholder for Parrot shadowing copy.

**Rationale:** User explored shadcnblocks; Hero 115 is free, centered, calm, single-CTA — fits educational product without heavy animation. Uses existing shadcn Button/theme tokens.

**Alternatives considered:**

- Custom hero from scratch — acceptable but slower; Hero 115 provides structure to adapt.
- Hero 45 (features + image swap) — richer but more complex for v1.
- Pro blocks — require API key; unnecessary for v1.

### 3. Auth gate for `/learn` in layout

**Choice:** Server component in `src/app/learn/layout.tsx` calls `auth()`; if no session, `redirect()` to sign-in with `callbackUrl=/learn` (Auth.js sign-in URL with query param).

**Rationale:** Same pattern as CMS gate in `auth.ts` `authorized` callback but scoped to learner layout without touching global proxy for every route.

**Alternatives considered:**

- Extend `authorized` in `auth.ts` for `/learn/*` — valid; layout-level check is simpler and colocated.

### 4. Signed-in redirect on `/`

**Choice:** Landing page server component checks `auth()`; if session exists, `redirect(ROUTES.LEARN.HOME)`.

**Rationale:** Marketing page is guest-only; returning users go straight to learner space.

### 5. Post-auth callback URL

**Choice:** Add `ROUTES.LEARN.HOME = "/learn"` and use it consistently in:

- `src/app/signup/actions.ts` (`redirectTo`)
- `src/app/signup/_components/google-signup-button.tsx` (`callbackUrl`)
- Landing header sign-in links (`/api/auth/signin?callbackUrl=/learn` or Auth.js equivalent)
- Signup page sign-in link

**Rationale:** Single constant avoids drift; specs reference `ROUTES.LEARN.HOME`.

**Alternatives considered:**

- `ROUTES.PUBLIC.POST_AUTH` alias — optional; `LEARN.HOME` is sufficient.

### 6. Learner space v1 content

**Choice:** Welcome heading + short copy + optional muted empty state ("Speech catalog coming soon"). No tRPC catalog wiring in this change.

**Rationale:** Unblocks landing + auth funnel; catalog is a natural follow-up using existing `speechPublications.list`.

### 7. Site header component

**Choice:** Shared `SiteHeader` under `src/app/(marketing)/_components/` reused by `(marketing)/layout.tsx` and `learn/layout.tsx` (or a thin `src/components/site-header.tsx` if both need it).

**Rationale:** Consistent brand + auth controls across landing and learner space.

## Risks / Trade-offs

- **[Hero 115 default assets/copy]** → Replace placeholder image and strings with Parrot shadowing copy during implementation; remove vendor-specific defaults.
- **[shadcnblocks registry adds files]** → CLI copies source into project; review generated files for unused deps and align with `radix-nova` style.
- **[Auth.js sign-in styling differs from landing]** → Acceptable v1; landing uses shadcn theme, sign-in stays Auth.js default. Cross-links use `/learn` callback.
- **[CMS users also land on `/learn`]** → Operators navigate to `/cms` manually; role-based redirect deferred.
- **[Signed-in users cannot revisit marketing `/` without sign-out]** → Acceptable; marketing is acquisition-only.

## Migration Plan

1. Add `@shadcnblocks` registry; install Hero 115
2. Add route constants; create marketing layout + landing page; remove/replace old `page.tsx`
3. Create `/learn` layout (auth gate) and welcome page
4. Update signup redirects and auth links
5. Update root/landing metadata
6. Smoke test: guest sees landing; signup → `/learn`; sign-in → `/learn`; signed-in `/` → `/learn`; `/learn` without auth → sign-in; `/cms` unchanged

**Rollback:** Revert pages and route constants; remove shadcnblocks hero component; restore signup redirect to `/`.

## Open Questions

None — landing scope, hero choice, `/learn` destination, and auth redirects are resolved from exploration.
