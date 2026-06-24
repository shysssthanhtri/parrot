## 1. Thumbnail load window helper

- [x] 1.1 Add `getThumbnailLoadIndices(activeIndex, speechCount, windowSize = 3)` (or equivalent) returning clamped indices `[activeIndex, activeIndex + 1, activeIndex + 2]` in `src/app/(client)/learn/_lib/thumbnail-load-window.ts` or colocated with the carousel
- [x] 1.2 Add `shouldLoadThumbnail(speechIndex, loadedIndices)` helper that returns true when the index is in the accumulated load set

## 2. SpeechCard conditional image loading

- [x] 2.1 Add `loadThumbnail: boolean` and optional `priority?: boolean` props to `SpeechCard` in `src/app/(client)/learn/_components/speech-card.tsx`
- [x] 2.2 When `loadThumbnail` is false, render the existing placeholder cover UI even if `thumbnailUrl` is present
- [x] 2.3 When `loadThumbnail` is true, mount `<Image>` without unconditional `priority`; pass `priority` only when the prop is true

## 3. SpeechCarousel focused index and load tracking

- [x] 3.1 Track `activeIndex` in `SpeechCarousel` by subscribing to Embla `select` (or `CarouselApi` equivalent) in `src/app/(client)/learn/_components/speech-carousel.tsx`
- [x] 3.2 Maintain a `loadedIndices` Set (or equivalent) that grows as the focused index moves: merge indices from `getThumbnailLoadIndices(activeIndex, speeches.length)` on each index change
- [x] 3.3 Pass `loadThumbnail={loadedIndices.has(index)}`, `priority={index === 0}`, and speech index into each `SpeechCard` inside the carousel map

## 4. Quality checks

- [x] 4.1 Run lint on touched learn components
- [x] 4.2 Run typecheck/build to confirm no regressions
