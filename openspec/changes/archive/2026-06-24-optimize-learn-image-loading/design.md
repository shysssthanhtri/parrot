## Context

The `/learn` page renders published speeches in `SpeechCarousel` (`src/app/(client)/learn/_components/speech-carousel.tsx`), which maps every speech to a `CarouselItem` containing `SpeechCard`. Each `SpeechCard` mounts a Next.js `<Image>` with `priority` and `unoptimized` when `thumbnailUrl` is present (`src/app/(client)/learn/_components/speech-card.tsx`).

Because all carousel items mount at once, the browser requests every publication thumbnail on first paint. With many published speeches this increases bandwidth, competes with the visible cover for LCP, and slows initial load — especially on mobile.

An earlier catalog implementation (`learner-speech-catalog.tsx`) rendered only the focused card and used native `Image()` prefetch for the next two speeches. The new carousel-based UI lost that optimization and regressed to eager loading.

`speechPublications.list` already returns all metadata and signed `thumbnailUrl` values in one server request; this change only controls which thumbnails the client actually fetches.

## Goals / Non-Goals

**Goals:**

- Limit active thumbnail image requests to a sliding window of three speeches: focused index _n_ and _n + 1_, _n + 2_.
- On initial load (focused index 0), load thumbnails for speeches at indices 0, 1, and 2.
- Update the window when the carousel focused index changes (keyboard, chevrons, swipe).
- Skip speeches with null `thumbnailUrl`.
- Apply `priority` only to the initially visible thumbnail (index 0 on first paint).
- Show the existing placeholder cover UI for speeches outside the load window.

**Non-Goals:**

- Loading thumbnails for speeches before the focused index (backward navigation may briefly show placeholder until cached from a prior visit).
- Prefetching speech audio or other assets.
- Server-side or CDN changes (cache headers, edge prefetch).
- Changing `speechPublications.list` or adding a dedicated thumbnail API.
- Virtualizing carousel DOM nodes — cards outside the window keep title/metadata; only the cover `<Image>` is deferred.

## Decisions

### Track focused index in `SpeechCarousel` via Embla `CarouselApi`

Subscribe to the carousel `select` event (or equivalent from `CarouselApi`) to maintain `activeIndex` in React state. Pass `activeIndex` and each item's index to `SpeechCard` so it can decide whether to mount `<Image>`.

**Alternative:** Intersection Observer per card — rejected; carousel items may be in DOM but off-screen; index-based window is simpler and matches the stated requirement.

**Alternative:** Render only one card (revert to catalog pattern) — rejected; user chose carousel UX; windowed images preserve carousel structure.

### Pure helper for the load window

Add a small helper, e.g. `shouldLoadThumbnail(speechIndex, activeIndex, windowSize = 3)`, or `getThumbnailLoadIndices(activeIndex, speechCount, windowSize = 3)` returning indices `[activeIndex, activeIndex + 1, activeIndex + 2]` clamped to list bounds. Colocate in `speech-carousel.tsx` or `learn/_lib/thumbnail-load-window.ts`.

### Conditional `<Image>` in `SpeechCard`

Add props such as `loadThumbnail: boolean` and `priority?: boolean`. When `loadThumbnail` is false, render the existing placeholder (same as no `thumbnailUrl`) even if a URL exists. When true, mount `<Image>` as today.

Remove unconditional `priority` from all cards; set `priority` only when `speechIndex === 0 && activeIndex === 0` on first paint (or simply `speechIndex === 0` for the initial LCP candidate).

**Alternative:** Native `Image()` prefetch only (keep all `<Image>` mounted) — rejected; still triggers Next.js image pipeline for every card; does not meet the goal of loading only three thumbnails.

**Alternative:** `loading="lazy"` on all images — rejected; carousel layout may still eagerly fetch many visible/near-visible images; explicit window is clearer.

### Optional native prefetch for the next two within the window

When the window already mounts `<Image>` for _n_, _n+1_, _n+2_, additional native prefetch is unnecessary. If implementation mounts `<Image>` only for the focused speech and uses prefetch for +1/+2, that also satisfies the requirement — prefer mounting `<Image>` for all three indices in the window so covers appear instantly when the user navigates within the window.

### Preserve already-loaded thumbnails when leaving the window

Once `<Image>` has mounted for an index, keep it mounted (or rely on browser cache on return). Simplest approach: track a `loadedIndices` Set in carousel state — when index enters the window, add to set; `SpeechCard` loads if index is in set. This avoids flicker when navigating backward into a previously visited speech.

**Alternative:** Drop images when leaving window — rejected; causes cover flash on backward navigation.

## Risks / Trade-offs

- **[Placeholder flash on backward navigation]** → Mitigated by `loadedIndices` retention; first visit to an earlier speech may still show placeholder briefly.
- **[Extra state in carousel]** → Small `activeIndex` + `loadedIndices`; acceptable for clear behavior.
- **[Signed URL expiry]** → Same URLs used when the card loads; no regression vs today.
- **[All carousel items still in DOM]** → Title/metadata for every speech still render; only image bytes are deferred — acceptable trade-off without full virtualization.

## Migration Plan

1. Add load-window helper and focused-index tracking in `speech-carousel.tsx`.
2. Update `SpeechCard` to accept `loadThumbnail` / `priority` props.
3. Manual verify on `/learn` with 5+ speeches: Network tab shows at most three thumbnail requests on load; navigating to index 3 fetches index 5 if not already loaded; navigating within 0–2 does not add requests.
4. Rollback: revert client components only; no data migration.

## Open Questions

None — window size of three (current + next two) matches the stated requirement.
