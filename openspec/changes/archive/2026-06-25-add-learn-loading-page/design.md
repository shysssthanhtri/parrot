## Context

The learner space at `/learn` uses a dedicated layout (`layout.tsx`) that checks auth and renders `LearnHeader`, then a `page.tsx` async server component that calls `speechPublications.list` before rendering `SpeechCarousel`. Unlike CMS list routes (e.g. `/cms/speeches`), `/learn` has no `loading.tsx`, so the main area stays empty until the fetch completes.

CMS loading UIs follow a consistent pattern: route-level `loading.tsx` files using shadcn `Skeleton`, mirroring the loaded page layout. The learner catalog uses a vertical carousel with a single visible portrait `SpeechCard` (~400×500–560px on desktop, full width on mobile).

## Goals / Non-Goals

**Goals:**

- Stream an instant loading fallback for `/learn` page content while the server fetch suspends.
- Match the visual footprint of the loaded speech card to avoid layout shift when data arrives.
- Reuse existing UI primitives (`Card`, `Skeleton`) and follow CMS `loading.tsx` conventions.

**Non-Goals:**

- Skeleton loading for layout auth (header appears once layout resolves; acceptable and consistent with CMS).
- Client-side loading states inside `SpeechCarousel` or TanStack Query refetches.
- Loading UI for empty catalog, thumbnail decode, or navigation transitions.
- Chevron, hint, or position-indicator skeletons (those appear only after catalog mounts).

## Decisions

### 1. Route-level `loading.tsx` at the learn segment

**Choice:** Add `src/app/(client)/learn/loading.tsx` as a default export.

**Rationale:** Next.js automatically wraps `page.tsx` in a Suspense boundary and renders `loading.tsx` as the fallback while the async page suspends. No changes to `page.tsx`, tRPC, or data fetching are required.

**Alternatives considered:**

- Client wrapper with React Query — rejected; page already uses server-side fetch and the CMS pattern is server streaming.
- Suspense boundary inside `page.tsx` — rejected; route-level `loading.tsx` is the established project pattern.

### 2. Portrait card skeleton matching `SpeechCard`

**Choice:** Render one centered `Card` with:

- A flex-1 cover region filled with `Skeleton` (portrait aspect, `min-h-0 flex-1`).
- A `CardHeader` with two skeleton bars for title (~60% width) and metadata (~30% width).
- Outer container classes aligned with `SpeechCarousel` / `page.tsx`: `flex min-h-0 flex-1 flex-col overflow-hidden w-full items-center`, inner card `h-full max-h-[500px] md:max-h-[560px] w-full md:max-w-[400px]`.

**Rationale:** Minimizes layout shift when the real carousel replaces the skeleton. Matches the single-card Shorts-style catalog.

**Alternatives considered:**

- Generic spinner — rejected; inconsistent with CMS and does not preserve layout.
- Multiple stacked card skeletons — rejected; only one card is visible at a time in the loaded UI.

### 3. Inline vs extracted component

**Choice:** Implement inline in `loading.tsx` initially; extract to `_components/learn-page-skeleton.tsx` only if the file exceeds ~40 lines.

**Rationale:** Matches the voices loading design precedent; keeps the diff small.

### 4. No chevron skeletons on desktop

**Choice:** Omit carousel navigation skeletons during loading.

**Rationale:** Chevrons are part of `SpeechCarousel`, which mounts only after data loads. Adding chevron skeletons would imply interactivity that is not yet available.

## Risks / Trade-offs

- **[Brief flash on fast networks]** → Acceptable; Next.js may skip loading UI when the fetch completes before paint.
- **[Layout auth still blocks first paint]** → Header waits on `auth()` in layout; same class of behavior as CMS authenticated routes. Out of scope for this change.
- **[Skeleton vs empty state]** → Loading UI only shows during fetch; empty catalog still handled by page once data returns `[]`.

## Migration Plan

1. Add `loading.tsx` under `src/app/(client)/learn/`.
2. Verify locally by navigating to `/learn` with network throttling or artificial delay if needed.
3. No database, env, or deployment migration required.

## Open Questions

_None._
