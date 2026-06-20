## 1. Dependencies and Workflow setup

- [x] 1.1 Add `workflow@^4.5.0` to `package.json` and install
- [x] 1.2 Configure Next.js for Workflow (`withWorkflow()` in `next.config.ts` per SDK docs)

## 2. Database schema

- [x] 2.1 Add `SpeechThumbnailGenerationStatus` enum (`processing`, `finished`, `failed`) and `SpeechThumbnailGeneration` model to `prisma/schema.prisma` with one-to-one relation on `Speech`
- [x] 2.2 Remove `thumbnailProcessStatus` and `thumbnailErrorMessage` from `Speech` in schema
- [x] 2.3 Create Prisma migration with backfill SQL mapping existing speech thumbnail status to generation rows
- [x] 2.4 Run `prisma generate`

## 3. Workflow implementation

- [x] 3.1 Create `src/workflows/speech-thumbnail.ts` with `speechThumbnailWorkflow` and steps: mark processing, generate/upload, finalize with `workflowRunId` guard
- [x] 3.2 Refactor `src/lib/speech-thumbnail-processing.ts` into step-callable helpers (prompt load, Modal call, upload) without queue `deliveryCount` retry logic
- [x] 3.3 Create `src/lib/speech-thumbnail-workflow.ts` with `startSpeechThumbnailWorkflow(speechId)` and `cancelSpeechThumbnailWorkflow(workflowRunId)` using `start()` and `getRun().cancel()`

## 4. Remove queue infrastructure

- [x] 4.1 Delete `src/app/api/queues/speech-thumbnail/route.ts`
- [x] 4.2 Remove `speech-thumbnail` trigger from `vercel.json`
- [x] 4.3 Remove or replace `src/lib/speech-thumbnail-jobs.ts` queue `send()` with workflow starter exports

## 5. API and server logic

- [x] 5.1 Update `speeches.create` in `src/trpc/routers/speeches.ts` to start thumbnail workflow and upsert generation row (replace `enqueueSpeechThumbnail`)
- [x] 5.2 Update `speeches.regenerateThumbnail` to cancel previous run, reset state, and start new workflow
- [x] 5.3 Update `speeches.getById` to include `thumbnailGeneration` and resolve thumbnail URL from generation status + `thumbnailR2ObjectKey`
- [x] 5.4 Update `src/lib/speech-publish-readiness.ts` and `src/lib/speech-publication.ts` to read thumbnail readiness from `SpeechThumbnailGeneration`

## 6. CMS UI

- [x] 6.1 Update `speech-thumbnail-card.tsx` and `speech-detail.tsx` to use generation status/error instead of `thumbnailProcessStatus` / `thumbnailErrorMessage`
- [x] 6.2 Update `speech-detail-client.tsx` polling to use `thumbnailGeneration.status === 'processing'`

## 7. Verification

- [x] 7.1 Run lint, typecheck, and production build
