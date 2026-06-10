## 1. Progress helper

- [x] 1.1 Add `src/lib/speech-generation-progress.ts` with `getSpeechGenerationProgress(processStatus, totalChunks, settledChunks)` returning phase, percent, counters, and display label per design (starting / synthesizing / finalizing)
- [x] 1.2 Add unit tests for progress calculation edge cases (pending with zero chunks, mid-synthesis, finalize phase, non-in-progress returns null)

## 2. Speech detail UI

- [x] 2.1 Extend `SpeechDetailProps` / `speech-detail.tsx` to accept `totalChunks` and `settledChunks` from `getById`
- [x] 2.2 Replace the static "Generating audio" card with a `Progress` bar, percentage, and chunk fraction (or starting/finalizing labels) driven by the helper
- [x] 2.3 Verify existing poll loop in `speech-detail-client.tsx` updates progress as counters change (no poll interval changes required)

## 3. API contract

- [x] 3.1 Confirm `speeches.getById` returns `totalChunks` and `settledChunks` in the tRPC response (add explicit select or mapping if needed)

## 4. Verification

- [x] 4.1 Manually verify on a multi-chunk speech: detail page shows increasing percentage as chunks complete, then finalizing label, then finished audio
- [x] 4.2 Run `pnpm typecheck` and relevant tests
