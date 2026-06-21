## Why

Speech TTS generation still runs on Vercel Queue with three topics (start, chunk, finalize), `SpeechChunk` rows, and job state spread across `Speech` fields. That offers little observability, cannot cancel in-flight work, and lets stale queue deliveries race with `regenerate` and `retry`—the same problems thumbnail generation had before migrating to Vercel Workflow. Thumbnails now use `SpeechThumbnailGeneration` with cancel-on-restart and `workflowRunId` guards; TTS should follow the same pattern so authors get reliable async audio generation and debuggable jobs in the Vercel dashboard.

## What Changes

- Add a `SpeechTtsGeneration` Prisma model (one row per speech, latest state only) with `status` enum (`processing`, `finished`, `failed`), optional `errorMessage`, `workflowRunId`, and `processingStartedAt` for the stuck-regenerate gate.
- Remove TTS job state from `Speech`: `processStatus`, `errorMessage`, `totalChunks`, `settledChunks`, `processingStartedAt`. **Keep** `r2ObjectKey` and `alignment` on `Speech` as final artifacts.
- Remove the `SpeechChunk` model; chunk text and temp storage are handled inside the workflow (deterministic temp R2 keys, in-memory metadata between steps).
- Replace the three Vercel Queue topics (`speech-tts-start`, `speech-tts-chunk`, `speech-tts-finalize`) with a single Vercel Workflow that: marks generation in progress, splits the script, synthesizes chunk 0 (Modal warmup), processes remaining chunks in batches of 10, then finalizes (concat, alignment, upload final WAV, delete temps).
- On `speeches.create`, `speeches.retry`, and `speeches.regenerate`, cancel any in-flight workflow (best-effort) and start a new run; persist `workflowRunId`. Stale runs SHALL NOT update DB state when `workflowRunId` no longer matches.
- **Fail-fast**: first chunk failure marks generation `failed` immediately; remaining batches are not processed.
- **Retry** accepts `failed` or `processing` (cancel current run, restart); **regenerate** remains the full reset including final WAV deletion.
- CMS shows a spinner while `ttsGeneration.status === 'processing'` (no chunk progress bar).
- Remove all TTS queue handlers from `vercel.json` and delete `src/app/api/queues/speech-tts-*`; remove `@vercel/queue` dependency (last consumer).
- **BREAKING**: Database migration drops `Speech` TTS status fields and `SpeechChunk`; API responses replace `processStatus` / chunk counters with nested `ttsGeneration` (or equivalent).

## Capabilities

### New Capabilities

_(none — TTS orchestration remains under `speech-tts-jobs`)_

### Modified Capabilities

- `speech-tts-jobs`: Replace Vercel Queue (three topics, settlement gate, chunk fan-out) with Vercel Workflow; track lifecycle on `SpeechTtsGeneration`; batch size 10; fail-fast; cancel previous workflow on retry/regenerate; guard final writes by `workflowRunId`.
- `speeches`: Remove TTS status fields and `SpeechChunk` from model; create/retry/regenerate start Workflow instead of queue send; expose TTS generation status via relation; update publish readiness and detail/list APIs; extend retry to `processing` speeches (cancel + restart).
- `cms-speeches`: Replace chunk progress bar with spinner-only in-flight UX; poll and display status from `ttsGeneration`; update list status column and detail badges.

## Impact

- **Database**: Prisma migration — new `SpeechTtsGeneration` model + enum; drop `Speech.processStatus`, `errorMessage`, `totalChunks`, `settledChunks`, `processingStartedAt`, and `SpeechChunk`; backfill generation rows from existing speech data.
- **API**: `src/trpc/routers/speeches.ts` — create, getById, retry, regenerate, getPublishReadiness; `src/lib/speech-publish-readiness.ts`, `src/lib/speech-publication.ts`, `src/lib/speech-regenerate*.ts`.
- **Background jobs**: New `speechTtsWorkflow` module and steps; remove `src/lib/speech-tts-jobs.ts` queue send, `src/lib/speech-tts-processing.ts` queue handlers, and `src/app/api/queues/speech-tts-*`.
- **CMS UI**: `speech-detail.tsx`, `speech-detail-client.tsx`, `speeches-table.tsx` — read `ttsGeneration` status; remove chunk progress UI; remove `speech-generation-progress` usage.
- **Config**: Remove all TTS queue triggers from `vercel.json`.
- **Dependencies**: Remove `@vercel/queue`; reuse existing `workflow@^4.5.0` setup from thumbnail migration.
