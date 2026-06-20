## Context

Speech thumbnails are generated asynchronously when a CMS author creates a speech or manually regenerates the cover image. Today this uses `@vercel/queue` topic `speech-thumbnail` (`src/app/api/queues/speech-thumbnail/route.ts`, `src/lib/speech-thumbnail-jobs.ts`) with job state stored on `Speech` (`thumbnailProcessStatus`, `thumbnailErrorMessage`, `thumbnailR2ObjectKey`). TTS continues to use Vercel Queue and is out of scope.

Pain points: no dashboard visibility into in-flight thumbnail jobs; queue messages cannot be cancelled; `regenerateThumbnail` can leave a stale delivery that races with a new run.

## Goals / Non-Goals

**Goals:**

- Run thumbnail generation as a Vercel Workflow with step-level observability in the Vercel dashboard.
- Persist job lifecycle on a dedicated `SpeechThumbnailGeneration` model (one row per speech, latest state only).
- Cancel the previous workflow run on regenerate using stored `workflowRunId`.
- Prevent stale runs from updating DB state via `workflowRunId` guard on finalize.
- Remove thumbnail status fields from `Speech`; keep `thumbnailR2ObjectKey` as the artifact pointer.

**Non-Goals:**

- Migrating TTS jobs to Workflow.
- Thumbnail generation history / audit log.
- In-flight Modal abort via `AbortSignal` (Workflow SDK 5 beta); cooperative cancel at step boundaries on stable `workflow@4.5.0` is sufficient for v1.
- Changing Modal deployment, prompt building, or R2 key layout.

## Decisions

### 1. Vercel Workflow on stable SDK (`workflow@^4.5.0`)

Use the latest stable package for `start()`, `getRun(runId).cancel()`, and `'use workflow'` / `'use step'` directives. SDK 5 beta adds durable `AbortSignal` for mid-step fetch abort; defer unless Modal latency makes step-boundary cancel insufficient.

**Alternative considered:** Stay on Queue — rejected due to observability and cancel limitations.

### 2. `SpeechThumbnailGeneration` model (1:1 with Speech)

```prisma
enum SpeechThumbnailGenerationStatus {
  processing
  finished
  failed
}

model SpeechThumbnailGeneration {
  id            String                          @id @default(cuid())
  speechId      String                          @unique
  status        SpeechThumbnailGenerationStatus
  errorMessage  String?
  workflowRunId String?
  createdAt     DateTime                        @default(now())
  updatedAt     DateTime                        @updatedAt
  speech        Speech                          @relation(...)
}
```

No `pending` status: the tRPC mutation upserts `processing` synchronously before returning, so CMS never polls an empty generation row after create/regenerate.

**Alternative considered:** Keep status on `Speech` — rejected; job lifecycle belongs on the job record.

### 3. Keep `Speech.thumbnailR2ObjectKey` only

Publish readiness, delete, and URL resolution continue to read the key from `Speech`. The workflow assigns the key at processing start (same as today: `speeches/{id}/thumbnail.webp`).

### 4. Workflow structure

New file e.g. `src/workflows/speech-thumbnail.ts`:

```
speechThumbnailWorkflow(speechId)
  Step markProcessing     — assign Speech.thumbnailR2ObjectKey if null; ensure generation row is processing
  Step generateAndUpload  — build prompt, call Modal, upload WebP (reuse src/lib/speech-thumbnail-processing helpers)
  Step finalize           — workflowRunId guard; set generation finished/failed; clear/set errorMessage
```

Entry points (`speeches.create`, `regenerateThumbnail`) in `src/lib/speech-thumbnail-workflow.ts`:

1. (Regenerate only) Best-effort `getRun(oldRunId).cancel()` if generation exists and status is `processing`.
2. (Regenerate only) Delete old R2 object; set `Speech.thumbnailR2ObjectKey` to null.
3. `const run = await start(speechThumbnailWorkflow, [speechId])`.
4. Upsert `SpeechThumbnailGeneration`: `status: processing`, `workflowRunId: run.runId`, `errorMessage: null`.

Finalize step loads generation by `speechId` and skips updates if `generation.workflowRunId !== currentRunId`.

### 5. Remove queue infrastructure for thumbnails

Delete `src/app/api/queues/speech-thumbnail/route.ts`, remove `speech-thumbnail` from `vercel.json`, replace `enqueueSpeechThumbnail` with workflow starter. Keep `@vercel/queue` for TTS.

### 6. CMS and API surface

- `speeches.getById` includes `thumbnailGeneration: { status, errorMessage } | null` (or flattened fields).
- Thumbnail URL when `generation.status === finished` and object exists at `thumbnailR2ObjectKey`.
- Poll while `thumbnailGeneration?.status === 'processing'`.
- Thumbnail card uses generation status enum, not `speechProcessStatusSchema`.

### 7. Next.js Workflow setup

Add `workflow` dependency, wrap Next config with `withWorkflow()` per Workflow SDK docs, deploy on Vercel with Workflows enabled. Local dev uses Workflow dev backend or documented fallback.

## Risks / Trade-offs

| Risk                                                        | Mitigation                                                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Cancel is cooperative; Modal step may complete after cancel | `workflowRunId` guard on finalize prevents stale writes                                         |
| Cancel API throws if run already completed                  | Wrap in try/catch; proceed with new workflow                                                    |
| First Workflow in repo; setup learning curve                | Scope to linear 3-step flow; document in tasks                                                  |
| Migration drops columns while jobs may be in flight         | Deploy during low traffic; backfill generation from Speech; old queue handler removed on deploy |
| `getRun().cancel()` requires Vercel deployment              | Workflow runs locally via dev kit; cancel tested on preview/prod                                |

## Migration Plan

1. Add `SpeechThumbnailGeneration` + enum; keep old Speech columns temporarily if needed for backfill script in migration SQL.
2. Data migration: for each Speech with non-null thumbnail state, insert/update generation row (`finished` if `thumbnailProcessStatus === 'finished'`, `failed` if failed, `processing` if processing/pending).
3. Deploy application code (workflow + API changes) and remove queue handler in same release.
4. Migration step 2: drop `Speech.thumbnailProcessStatus` and `Speech.thumbnailErrorMessage`.
5. Rollback: revert deploy; re-add queue handler only if generation rows are inconsistent (manual fix preferred).

## Open Questions

_(none — decisions confirmed in exploration)_
