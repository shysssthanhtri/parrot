## 1. Database and shared types

- [x] 1.1 Add Prisma fields on `Speech`: `processStatus`, `errorMessage`, `totalChunks`, `settledChunks`; add `SpeechChunk` model with relations and indexes
- [x] 1.2 Create migration and backfill existing speeches to `processStatus: finished`
- [x] 1.3 Add shared constants/types for speech process status values used by API, jobs, and UI

## 2. Vercel Queue infrastructure

- [x] 2.1 Add `@vercel/queue` dependency and root `vercel.json` with three queue triggers and `maxDuration` settings
- [x] 2.2 Add shared speech TTS job helpers (enqueue start/chunk/finalize, load speech inputs, settlement gate, mark speech failed, chunk key helpers)
- [x] 2.3 Document local dev setup (`vercel link`, `vercel env pull`) in project README or existing deploy docs

## 3. Queue consumers

- [x] 3.1 Implement `speech-tts-start` route: split script, create chunk rows, synthesize chunk 0, fan-out chunk jobs or finalize
- [x] 3.2 Implement `speech-tts-chunk` route: synthesize one chunk, store temp WAV or mark chunk failed, increment `settledChunks`, run settlement gate (finalize or speech failed)
- [x] 3.3 Implement `speech-tts-finalize` route: concat WAVs, build alignment, upload final object, set finished, delete temp chunks
- [x] 3.4 Extract reusable finalize/alignment builder from existing `generateLongSpeech` logic where practical

## 4. tRPC speeches API

- [x] 4.1 Rewrite `speeches.create` for async enqueue (no client id/key/alignment)
- [x] 4.2 Add `speeches.retry` for failed speeches
- [x] 4.3 Update `speeches.list` and `speeches.getById` to return process status and gate `audioUrl` on `finished`
- [x] 4.4 Remove `speeches.generatePreview` and `speeches.getUploadUrl` from router and client usage

## 5. CMS UI

- [x] 5.1 Simplify `speech-create-form`: single Create button, remove preview/upload flow, redirect on success
- [x] 5.2 Add process status column to `speeches-table` and update list loading skeleton
- [x] 5.3 Update `speech-detail` for generating state, polling, failed error display, and retry button
- [x] 5.4 Wire React Query `refetchInterval` on detail page while status is pending or processing

## 6. Storage utilities

- [x] 6.1 Add `readObject` / delete helpers and chunk key path builder (`speeches/{id}/chunks/{index}.wav`) using the existing storage driver (R2 or local)
- [x] 6.2 Ensure finalize reads temp chunks from R2/local, uploads final WAV via `uploadObject`, and deletes all temp chunk keys for a speech

## 7. Verification

- [ ] 7.1 Add unit tests for alignment aggregation from chunk metadata (mirror `generateLongSpeech` segment math)
- [ ] 7.2 Manually verify create → detail polling → finished playback for short and multi-chunk scripts
- [ ] 7.3 Manually verify failed speech retry path and list status display
