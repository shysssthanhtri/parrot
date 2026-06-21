## 1. Database schema

- [x] 1.1 Add `SpeechTtsGenerationStatus` enum (`processing`, `finished`, `failed`) and `SpeechTtsGeneration` model to `prisma/schema.prisma` with one-to-one relation on `Speech`
- [x] 1.2 Remove `processStatus`, `errorMessage`, `totalChunks`, `settledChunks`, `processingStartedAt` from `Speech` and remove `SpeechChunk` model in schema
- [x] 1.3 Create Prisma migration with backfill SQL mapping existing speech TTS status to generation rows
- [x] 1.4 Run `prisma generate`

## 2. Workflow implementation

- [x] 2.1 Create `src/workflows/speech-tts.ts` with `speechTtsWorkflow` orchestrating mark processing, split/warmup, batch synthesis, and finalize with `workflowRunId` guards
- [x] 2.2 Create `src/lib/speech-tts-workflow-steps.ts` with step functions: split/warmup chunk 0, synthesize batches of 10 with fail-fast, finalize (concat, alignment, upload, delete temps)
- [x] 2.3 Refactor reusable logic from `src/lib/speech-tts-processing.ts` into step-callable helpers (synthesize, concat, alignment) without queue `deliveryCount` retry logic
- [x] 2.4 Create `src/lib/speech-tts-workflow.ts` with `startSpeechTtsWorkflow(speechId)` and `cancelSpeechTtsWorkflow(workflowRunId)` using `start()` and `getRun().cancel()`

## 3. Remove queue infrastructure

- [x] 3.1 Delete `src/app/api/queues/speech-tts-start/route.ts`, `speech-tts-chunk/route.ts`, and `speech-tts-finalize/route.ts`
- [x] 3.2 Remove all TTS queue triggers from `vercel.json`
- [x] 3.3 Remove `@vercel/queue` from `package.json` and delete or replace `src/lib/speech-tts-jobs.ts` queue sends with workflow starter exports
- [x] 3.4 Remove obsolete queue processing exports from `src/lib/speech-tts-processing.ts` or delete the file if fully superseded

## 4. API and server logic

- [x] 4.1 Update `speeches.create` in `src/trpc/routers/speeches.ts` to start TTS workflow and upsert generation row (replace `enqueueSpeechTtsStart`)
- [x] 4.2 Update `speeches.retry` to accept `failed` or `processing`, cancel in-flight workflow, clean temp chunks, and start new workflow
- [x] 4.3 Update `speeches.regenerate` to cancel in-flight workflow, adapt `resetSpeechForTtsRestart` for no `SpeechChunk` rows, and start new workflow
- [x] 4.4 Update `speeches.getById` and list include to expose `ttsGeneration` and resolve audio URL from generation status + `r2ObjectKey`
- [x] 4.5 Update `src/lib/speech-publish-readiness.ts`, `src/lib/speech-publication.ts`, and `src/lib/speech-regenerate-eligibility.ts` to read TTS readiness from `SpeechTtsGeneration`
- [x] 4.6 Update `speeches.delete` storage cleanup to delete temp chunks by prefix/pattern without `SpeechChunk` rows

## 5. CMS UI

- [x] 5.1 Update `speech-detail.tsx` and `speech-detail-client.tsx` to use `ttsGeneration` status/error, spinner-only generating state, and poll while `processing`
- [x] 5.2 Update `speeches-table.tsx` and process status badge to read from `ttsGeneration.status`
- [x] 5.3 Remove `getSpeechGenerationProgress` usage and delete or trim `src/lib/speech-generation-progress.ts` if unused

## 6. Verification

- [x] 6.1 Run lint, typecheck, and production build
