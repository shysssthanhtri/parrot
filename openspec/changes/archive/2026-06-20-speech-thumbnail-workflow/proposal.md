## Why

Speech thumbnail generation today runs on Vercel Queue, which offers little observability into in-flight jobs and cannot cancel queued or running work. That creates a real bug on manual regenerate: a stale queue delivery can finish after a new run starts and overwrite thumbnail state. Vercel Workflow gives step-level tracing in the dashboard and supports cancelling runs by `workflowRunId`, which fixes regenerate races and makes thumbnail jobs easier to debug.

## What Changes

- Add a `SpeechThumbnailGeneration` Prisma model (one row per speech, latest state only) with `status` enum (`processing`, `finished`, `failed`), optional `errorMessage`, and `workflowRunId` for cancel-on-regenerate.
- Remove `thumbnailProcessStatus` and `thumbnailErrorMessage` from `Speech`; **keep** `thumbnailR2ObjectKey` on `Speech` as the denormalized storage pointer.
- Replace the `speech-thumbnail` Vercel Queue topic and route handler with a Vercel Workflow (`workflow@4.5.0` stable) that: marks generation in progress, generates and uploads the thumbnail, then finalizes status on `SpeechThumbnailGeneration` and `Speech`.
- On `speeches.create` and `speeches.regenerateThumbnail`, start the workflow and persist `workflowRunId`; on regenerate, cancel the previous run (best-effort) before starting a new one. Stale runs SHALL NOT update DB state if their `workflowRunId` no longer matches the generation row.
- Update CMS speech detail UI, publish readiness, and tRPC responses to read thumbnail job status from `SpeechThumbnailGeneration` instead of `Speech` thumbnail status fields.
- Remove `speech-thumbnail` queue registration from `vercel.json` and delete `src/app/api/queues/speech-thumbnail/`.
- **BREAKING**: Database migration drops `Speech.thumbnailProcessStatus` and `Speech.thumbnailErrorMessage`; API responses no longer expose those fields (replaced by nested `thumbnailGeneration` or equivalent).

## Capabilities

### New Capabilities

_(none — thumbnail orchestration remains under `speech-thumbnail-jobs`)_

### Modified Capabilities

- `speech-thumbnail-jobs`: Replace Vercel Queue consumer with Vercel Workflow; track job lifecycle on `SpeechThumbnailGeneration`; cancel previous workflow on regenerate; guard final writes by `workflowRunId`.
- `speeches`: Remove thumbnail status fields from `Speech` model; create/regenerate start Workflow instead of queue send; expose thumbnail generation status via relation; update publish readiness and detail/list APIs.

## Impact

- **Database**: Prisma migration — new `SpeechThumbnailGeneration` model + enum; drop `Speech.thumbnailProcessStatus` and `Speech.thumbnailErrorMessage`; backfill generation rows from existing speech data.
- **API**: `src/trpc/routers/speeches.ts` — create, getById, regenerateThumbnail, getPublishReadiness; `src/lib/speech-publish-readiness.ts`, `src/lib/speech-publication.ts`.
- **Background jobs**: New workflow module; remove `src/lib/speech-thumbnail-jobs.ts` queue send and `src/app/api/queues/speech-thumbnail/route.ts`; refactor `src/lib/speech-thumbnail-processing.ts` into workflow steps.
- **CMS UI**: `speech-thumbnail-card.tsx`, `speech-detail-client.tsx` polling — read generation status enum instead of speech thumbnail process status.
- **Config**: Add `workflow` package and Next.js workflow setup; remove thumbnail queue trigger from `vercel.json`.
- **Dependencies**: Add `workflow@^4.5.0`; TTS queues unchanged.
