## Context

Speech TTS is generated asynchronously when a CMS author creates a speech or manually regenerates audio. Today this uses `@vercel/queue` with three topics (`speech-tts-start`, `speech-tts-chunk`, `speech-tts-finalize` in `src/app/api/queues/speech-tts-*`, `src/lib/speech-tts-jobs.ts`, `src/lib/speech-tts-processing.ts`) with job state on `Speech` (`processStatus`, `errorMessage`, `totalChunks`, `settledChunks`, `processingStartedAt`) and per-chunk rows in `SpeechChunk`. Thumbnails already migrated to Vercel Workflow with `SpeechThumbnailGeneration`, cancel-on-restart, and `workflowRunId` guards (`src/workflows/speech-thumbnail.ts`, `src/lib/speech-thumbnail-workflow.ts`).

Pain points: no dashboard visibility into in-flight TTS jobs; queue messages cannot be cancelled; `regenerate` and `retry` can race with stale chunk/finalize deliveries; three-topic orchestration with settlement gate is harder to reason about than a single workflow.

## Goals / Non-Goals

**Goals:**

- Run TTS generation as a Vercel Workflow with step-level observability in the Vercel dashboard.
- Persist job lifecycle on `SpeechTtsGeneration` (one row per speech, latest state only).
- Cancel the previous workflow run on `retry`, `regenerate`, and restart while `processing`.
- Prevent stale runs from updating DB state via `workflowRunId` guard on finalize/failure steps.
- Remove TTS status fields and `SpeechChunk` from `Speech`; keep `r2ObjectKey` and `alignment` as final artifacts.
- Process remaining chunks in batches of 10 (Modal `max_inputs=10`); fail-fast on first chunk failure.
- CMS shows spinner-only in-flight UX (no chunk progress bar).
- Remove all TTS queue infrastructure and `@vercel/queue` dependency.

**Non-Goals:**

- Changing Modal Chatterbox deployment, chunking rules (`splitTextForTts`), or R2 key layout.
- TTS generation history / audit log.
- In-flight Modal abort via `AbortSignal` (Workflow SDK 5 beta); cooperative cancel at step boundaries on stable `workflow@^4.5.0` is sufficient for v1.
- Chunk-level progress in CMS.
- Changing thumbnail workflow.

## Decisions

### 1. Mirror thumbnail Workflow pattern (`workflow@^4.5.0`)

Reuse existing `withWorkflow()` setup from the thumbnail migration. Use `start()`, `getRun(runId).cancel()`, and `'use workflow'` / `'use step'` directives.

**Alternative considered:** Stay on Queue — rejected due to observability, cancel limitations, and stale delivery races.

### 2. `SpeechTtsGeneration` model (1:1 with Speech)

```prisma
enum SpeechTtsGenerationStatus {
  processing
  finished
  failed
}

model SpeechTtsGeneration {
  id                  String                   @id @default(cuid())
  speechId            String                   @unique
  status              SpeechTtsGenerationStatus
  errorMessage        String?
  workflowRunId       String?
  processingStartedAt DateTime?
  createdAt           DateTime                 @default(now())
  updatedAt           DateTime                 @updatedAt
  speech              Speech                   @relation(...)
}
```

No `pending` status: entry points upsert `processing` synchronously before returning (same as thumbnail). `processingStartedAt` moves here for the 30-minute stuck-regenerate gate.

**Alternative considered:** Keep status on `Speech` — rejected; job lifecycle belongs on the job record.

### 3. Keep `Speech.r2ObjectKey` and `Speech.alignment` only

Publish readiness, delete, and URL resolution continue to read final artifacts from `Speech`. Temp chunk keys remain deterministic (`speeches/{id}/chunks/{index}.wav`) without DB rows.

### 4. Remove `SpeechChunk`; in-workflow chunk state

Split script once in a workflow step; hold chunk texts and `durationMs` in memory between steps. Upload each synthesized chunk to its temp R2 key; finalize reads temps, concats, builds alignment, uploads final WAV, deletes temps.

**Alternative considered:** Keep `SpeechChunk` for progress — rejected; spinner-only UX and simpler schema.

### 5. Workflow structure

New files `src/workflows/speech-tts.ts`, `src/lib/speech-tts-workflow-steps.ts`, `src/lib/speech-tts-workflow.ts`:

```
speechTtsWorkflow(speechId)
  Step markProcessing       — set processingStartedAt; workflowRunId guard
  Step splitAndWarmup       — splitTextForTts; synthesize chunk 0 → temp R2
  Step synthesizeInBatches  — chunks 1..N in batches of 10 (Promise.all per batch)
                            — fail-fast: first failure throws, no further batches
  Step finalize             — concat, alignment → Speech; delete temps
                            — generation → finished (workflowRunId guard)
  on failure                — generation → failed (workflowRunId guard)
```

Refactor reusable logic from `src/lib/speech-tts-processing.ts` (synthesize, concat, alignment) into step-callable helpers without queue `deliveryCount` retry logic. Workflow step retries cover transient Modal failures.

**Batch size:** 10 — matches Modal `@modal.concurrent(max_inputs=10)`.

**Fail-fast:** Unlike the queue model (wait for all chunks to settle), the workflow stops at the first chunk failure and marks generation `failed` immediately. In-flight Modal calls in the same batch may still complete (cooperative cancel).

### 6. Entry points in `src/lib/speech-tts-workflow.ts`

| Action       | Cancel prior run?   | Storage cleanup                         | Start workflow |
| ------------ | ------------------- | --------------------------------------- | -------------- |
| `create`     | No                  | No                                      | Yes            |
| `retry`      | Yes if `processing` | Chunks only; keep final WAV + alignment | Yes            |
| `regenerate` | Yes if `processing` | Chunks + final WAV + alignment          | Yes            |

Flow for each:

1. (retry/regenerate) Best-effort `getRun(oldRunId).cancel()` when generation exists with `status` `processing` and non-null `workflowRunId`.
2. (retry/regenerate) Run existing reset logic (`resetSpeechForTtsRestart` adapted — no `SpeechChunk` rows).
3. `const run = await start(speechTtsWorkflow, [speechId])`.
4. Upsert `SpeechTtsGeneration`: `status: processing`, `workflowRunId: run.runId`, `processingStartedAt: now`, `errorMessage: null`.

Finalize/failure steps skip updates when `generation.workflowRunId !== currentRunId`.

### 7. Retry accepts `failed` or `processing`

`speeches.retry` SHALL succeed when `ttsGeneration.status` is `failed` or `processing` (cancel + restart). It SHALL NOT apply to `finished` (use `regenerate`). Keeps final WAV on retry (existing behavior).

**Alternative considered:** Retry only on `failed` — rejected; user wants cancel+restart while processing.

### 8. Remove all TTS queue infrastructure

Delete `src/app/api/queues/speech-tts-{start,chunk,finalize}/`, remove all TTS triggers from `vercel.json`, remove `@vercel/queue` from `package.json`. Remove settlement gate, chunk fan-out, and `speech-tts-jobs.ts` queue sends.

### 9. CMS and API surface

- `speeches.getById` / `list`: expose `ttsGeneration: { status, errorMessage, processingStartedAt } | null`.
- Audio URL when `ttsGeneration.status === 'finished'` and object exists at `r2ObjectKey`.
- Poll while `ttsGeneration?.status === 'processing'`.
- Generating UI: spinner + "Generating audio…" (remove `getSpeechGenerationProgress` usage).
- List/detail badges read from `ttsGeneration.status` (no `pending` after create — immediately `processing`).
- Regenerate eligibility reads `ttsGeneration.status` and `processingStartedAt`.

## Risks / Trade-offs

| Risk                                                             | Mitigation                                                                                                                                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cancel is cooperative; Modal step may complete after cancel      | `workflowRunId` guard on finalize/failure prevents stale writes                                                                                                              |
| Cancel API throws if run already completed                       | Wrap in try/catch; proceed with new workflow                                                                                                                                 |
| Fail-fast vs old "wait for all chunks" behavior                  | Document in spec; saves Modal GPU on failure                                                                                                                                 |
| Migration drops columns/`SpeechChunk` while queue jobs in flight | Deploy during low traffic; backfill generation rows; remove queue handlers in same release                                                                                   |
| No chunk progress bar                                            | Accepted — spinner-only UX                                                                                                                                                   |
| Long workflow run (many chunks in one workflow)                  | Batched steps with Workflow step retries; observability in dashboard                                                                                                         |
| Delete must clean temp chunks without DB rows                    | Delete by key pattern `speeches/{id}/chunks/*.wav` or enumerate from last known split count stored nowhere — use prefix delete or list objects under `speeches/{id}/chunks/` |

## Migration Plan

1. Add `SpeechTtsGeneration` + enum; keep old Speech columns temporarily for backfill.
2. Data migration: for each Speech, insert/update generation row mapping `processStatus` (`finished` → `finished`, `failed` → `failed`, `processing`/`pending` → `processing`) and copy `processingStartedAt`, `errorMessage`.
3. Deploy application code (workflow + API + CMS) and remove queue handlers in same release.
4. Migration step 2: drop `Speech.processStatus`, `errorMessage`, `totalChunks`, `settledChunks`, `processingStartedAt`, and `SpeechChunk` table.
5. Rollback: revert deploy; manual fix preferred if generation rows inconsistent.

## Open Questions

_(none — decisions confirmed in exploration)_
