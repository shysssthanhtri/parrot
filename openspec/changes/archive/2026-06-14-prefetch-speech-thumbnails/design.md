## Context

`LearnerSpeechCatalog` (`src/app/(client)/learn/_components/learner-speech-catalog.tsx`) loads all published speeches via `speechPublications.list`, which already resolves a `thumbnailUrl` for each publication (signed R2 URL when the object exists). Only the focused speech renders `LearnerSpeechCard`, which mounts a Next.js `<Image>` for the thumbnail. Until that card mounts, the browser does not fetch the image bytes — so navigating to the next speech can show a blank cover during the slide transition while the thumbnail downloads.

This is a client-side image cache warm-up problem, not an API or data-fetching gap.

## Goals / Non-Goals

**Goals:**

- Prefetch thumbnail images for the next two speeches relative to the focused index.
- Update the prefetch window whenever `activeIndex` changes (keyboard, chevrons, initial load).
- Skip speeches with null `thumbnailUrl`.
- Keep implementation lightweight with no new dependencies.

**Non-Goals:**

- Prefetching thumbnails for speeches before the focused index (backward navigation is out of scope for v1 unless trivial to add).
- Prefetching speech audio or other assets.
- Server-side or CDN changes (HTTP cache headers, edge prefetch).
- Changing `speechPublications.list` or adding a dedicated thumbnail API.
- Visible prefetch UI (progress indicators, skeleton changes).

## Decisions

### Prefetch via browser `Image()` in a catalog `useEffect`

When `speeches` and `activeIndex` are known, compute indices `[activeIndex + 1, activeIndex + 2]` clamped to list bounds, collect non-null `thumbnailUrl` values, and assign each to `new Image().src` to trigger a low-priority fetch into the HTTP cache.

**Alternative:** Next.js `<link rel="preload" as="image">` in `head` — rejected for this scope; requires `next/head` or layout wiring and is harder to update per index change in a client component.

**Alternative:** Hidden off-screen `<Image>` nodes for upcoming speeches — rejected; adds DOM/layout complexity and still mounts Next Image logic unnecessarily.

**Alternative:** TanStack Query `prefetchQuery` — rejected; list data is already loaded; only image bytes need warming.

### Colocate logic in catalog; extract helper only if needed

Implement prefetch in `LearnerSpeechCatalog` with a small pure helper (e.g. `getUpcomingThumbnailUrls(speeches, activeIndex, count = 2)`) in the same file or a sibling `_lib` module. Avoid a generic hook unless reused elsewhere.

### Deduplicate URLs within a session

Track prefetched URLs in a `useRef<Set<string>>` so revisiting an index does not re-fetch the same thumbnail. The set can grow with catalog size but thumbnails are small cardinality per session.

### No change to `LearnerSpeechCard` `priority` prop

The active card may keep `priority` on `<Image>` for LCP on first paint. Prefetch handles upcoming cards; changing priority on the visible card is unnecessary.

## Risks / Trade-offs

- **[Extra bandwidth on initial load]** → Limited to two thumbnail images (~webp covers); acceptable for smoother browse UX.
- **[Signed URL expiry]** → Same URLs used by the card when navigated; if URLs expire mid-session, card would fail anyway — no regression.
- **[Prefetch ignored by browser on slow networks]** → Best-effort; active card still loads normally if prefetch misses.
- **[No backward prefetch]** → User navigating up may still see a brief load; acceptable per v1 scope; easy follow-up to mirror for `activeIndex - 1` and `activeIndex - 2`.

## Migration Plan

1. Add prefetch helper and `useEffect` in `learner-speech-catalog.tsx`.
2. Manual verify on `/learn` with 3+ speeches: DevTools Network tab shows upcoming thumbnail requests before navigation; navigating down shows immediate cover image.
3. Rollback: revert client component only; no data migration.

## Open Questions

None — forward lookahead of two thumbnails is sufficient for v1.
