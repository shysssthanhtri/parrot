## 1. Loading UI

- [x] 1.1 Create `src/app/(client)/learn/loading.tsx` — default export rendering the main content wrapper (`flex min-h-0 flex-1 flex-col overflow-hidden w-full items-center`) with a centered portrait `Card` skeleton: flex-1 cover `Skeleton`, title bar, and metadata bar using the same max dimensions as `SpeechCarousel` / `SpeechCard`
- [x] 1.2 If `loading.tsx` grows past ~40 lines, extract a `LearnPageSkeleton` component to `src/app/(client)/learn/_components/learn-page-skeleton.tsx` and re-export from `loading.tsx`

## 2. Verification

- [x] 2.1 Run `pnpm lint` and fix any issues in new files
- [x] 2.2 Run `pnpm typecheck` (or `tsc --noEmit`) and resolve type errors if any
