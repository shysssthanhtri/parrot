## Why

Speech TTS generation via Modal can take many minutes for long scripts, but the CMS today blocks users on synchronous preview generation and client-side upload before a speech row exists. Moving synthesis to background jobs with process status lets users create a speech immediately and return later when audio is ready.

## What Changes

- Add `processStatus` (`pending`, `processing`, `finished`, `failed`) and optional `errorMessage` on `Speech`, plus a `SpeechChunk` model to track per-chunk TTS progress and temp storage keys.
- Replace the new-speech flow: configure voice/script/TTS params → **Create** → redirect to detail (no preview, no client WAV upload).
- Introduce Vercel Queues with three topics: **start** (chunk 0 + warmup), **chunk** (parallel remainder, max concurrency 10), **finalize** (concat WAVs, build alignment, upload final object).
- Refactor `speeches.create` to insert a pending speech, pre-assign `r2ObjectKey`, and enqueue the start job; remove requirement for pre-uploaded audio and client-supplied alignment.
- Add `speeches.retry` for failed speeches (reset to pending, re-enqueue start job).
- Update CMS list and detail UI to show process status, poll while in-flight, and offer retry on failure.
- **BREAKING**: Remove `speeches.generatePreview` and `speeches.getUploadUrl` from the create flow (mutations may be removed or left unused).
- **BREAKING**: `speeches.create` input contract changes (no `id`, `r2ObjectKey`, or `alignment` from client).

## Capabilities

### New Capabilities

- `speech-tts-jobs`: Vercel Queue producers/consumers, chunk orchestration (start → chunk fan-out → finalize), temp chunk storage, aggregation, and retry enqueue.

### Modified Capabilities

- `speeches`: Async create, process status fields, server-side generation, retry API; remove preview/upload create requirements.
- `cms-speeches`: New-speech UX (create-only, no preview), list status column, detail polling and retry UI.

## Impact

- **Database**: Prisma migration for `Speech.processStatus`, `Speech.errorMessage`, `Speech.totalChunks`, `Speech.settledChunks`, and new `SpeechChunk` model.
- **API**: `src/trpc/routers/speeches.ts` — rewrite create, add retry, adjust getById/list; deprecate or remove generatePreview/getUploadUrl.
- **Queue**: New `@vercel/queue` dependency, `vercel.json` triggers, three API route handlers under `app/api/queues/`.
- **Storage**: Temp chunk and final speech WAVs use the existing storage driver (`local` in dev, **R2** in production) via `uploadObject` / read helpers — same as today’s speech audio. Keys: temp `speeches/{id}/chunks/{index}.wav`, final `speeches/{id}.wav`.
- **UI**: `speech-create-form.tsx`, `speeches-table.tsx`, `speech-detail.tsx` and related pages.
- **Reuse**: Existing `splitTextForTts`, `generateSpeech`, `concatWavBuffers`, `getWavDurationMs`, alignment validation.
- **Deploy**: Vercel project needs Queues enabled; local dev requires `vercel link` + `vercel env pull` for OIDC.
- **Modal**: No API changes; chunk concurrency aligned with `@modal.concurrent(max_inputs=10)` on existing deployment.
