## 1. Queue worker

- [x] 1.1 In `src/lib/speech-thumbnail-processing.ts`, remove the `Speech has no thumbnail key` throw from `loadSpeechThumbnailContext`
- [x] 1.2 Assign `thumbnailR2ObjectKey` via `speechThumbnailObjectKey(speechId)` when transitioning to `processing` (or when key is null mid-retry); persist before Modal call and upload
- [x] 1.3 On success, keep setting `thumbnailProcessStatus` to `finished` (key already persisted)

## 2. Speeches API

- [x] 2.1 Remove `thumbnailR2ObjectKey` from `speeches.create` in `src/trpc/routers/speeches.ts`
- [x] 2.2 Update `speeches.regenerateThumbnail` to set `thumbnailR2ObjectKey: null` after deleting any existing object

## 3. Verify downstream behavior

- [x] 3.1 Confirm `checkThumbnailReady` in `src/lib/speech-publish-readiness.ts` still requires non-null key + object when status is `finished` (no change expected)
- [x] 3.2 Confirm `speeches.getById` thumbnail URL resolution handles null key while pending/processing (no change expected)
