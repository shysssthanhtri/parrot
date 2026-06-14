## 1. Prefetch helper

- [x] 1.1 Add a pure helper (e.g. `getUpcomingThumbnailUrls`) that returns up to two non-null `thumbnailUrl` values for speeches at indices `activeIndex + 1` and `activeIndex + 2`, clamped to catalog bounds

## 2. Catalog integration

- [x] 2.1 In `learner-speech-catalog.tsx`, add a `useRef<Set<string>>` to track URLs already prefetched in the session
- [x] 2.2 Add a `useEffect` keyed on `speeches` and `activeIndex` that prefetches upcoming thumbnail URLs via `new Image().src`, skipping null URLs and URLs already in the set

## 3. Verification

- [x] 3.1 Run `pnpm lint` and fix any issues introduced by the change
- [x] 3.2 Run `pnpm typecheck` and ensure the prefetch code type-checks cleanly
