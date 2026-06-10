## Context

Parrot generates speech audio by calling the Modal-hosted Chatterbox TTS API (`POST /generate`) from the Next.js server. Long scripts are split into ~400-character chunks (`splitTextForTts`), synthesized sequentially, concatenated with a 400 ms gap (`concatWavBuffers`), and aligned per chunk (`getWavDurationMs`).

Today the CMS create flow is synchronous: `speeches.generatePreview` blocks while all chunks run, the client uploads the WAV via `speeches.getUploadUrl`, then `speeches.create` persists metadata and alignment. Modal cold start can take up to ~1 minute; long scripts can exceed Vercel function duration limits when run in a single request.

The Modal deployment (`modal/chatterbox_tts.py`) uses `@modal.enter()` to load the model once per container, `@modal.concurrent(max_inputs=10)` for up to ten concurrent inputs on one warm GPU, and `scaledown_window=5` minutes.

## Goals / Non-Goals

**Goals:**

- Create a speech row immediately with `processStatus: pending` and redirect to detail without waiting for TTS.
- Process TTS in background via Vercel Queues with observable status (`pending` → `processing` → `finished` | `failed`).
- Use a warmup-first orchestrator: one start job runs chunk 0 (Modal cold start), then fan out remaining chunks with bounded parallelism (10) matching Modal `max_inputs`.
- Aggregate chunk WAVs in a finalize job: concat, build alignment, upload final `speeches/{id}.wav`.
- Support manual retry from `failed` (re-enqueue start job).
- Update CMS list/detail UI for status, polling, and retry.

**Non-Goals:**

- Synchronous preview on the create page.
- Client-side WAV upload for new speeches.
- Edit/delete/archive speeches.
- Modal deployment changes (e.g. `min_containers` keep-warm).
- Migrating legacy speeches (rows without `processStatus` default to `finished` if audio exists).

## Decisions

### Process status on Speech

Add `processStatus` enum string: `pending`, `processing`, `finished`, `failed`. Default `pending` on create. Add optional `errorMessage` when `failed`. Add `totalChunks` and `settledChunks` counters — `settledChunks` increments when each chunk reaches a terminal state (`done` or `failed`), not only on success.

**Alternative:** Derive progress only from `SpeechChunk` rows — rejected; counters simplify atomic “all settled” checks in chunk handlers.

### SpeechChunk model

One row per TTS chunk, created upfront by the start job:

| Field                    | Purpose                                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `speechId`, `chunkIndex` | Unique per speech, ordered aggregation                                                                                             |
| `text`                   | Chunk text from `splitTextForTts`                                                                                                  |
| `status`                 | `pending`, `done`, `failed`                                                                                                        |
| `tempR2Key`              | Object key `speeches/{speechId}/chunks/{chunkIndex}.wav` (stored in R2 when `STORAGE_DRIVER=r2`, or local filesystem when `local`) |
| `durationMs`             | Set on completion via `getWavDurationMs`                                                                                           |

Chunk and final objects SHALL use the existing storage abstraction (`uploadObject`, `readObject`, delete helpers in `src/lib/storage`) — not a separate blob store. In production both temp chunks and the final WAV live in the same R2 bucket as voice samples and existing speech audio.

**Alternative:** Store chunk WAVs only in object storage without DB rows — rejected; finalize needs ordered metadata and completion tracking.

### Three Vercel Queue topics (Option A orchestrator)

| Topic                 | Consumer route                                | maxConcurrency | Role                                                                                                                                  |
| --------------------- | --------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `speech-tts-start`    | `app/api/queues/speech-tts-start/route.ts`    | 1              | Split script, create chunk rows, generate chunk 0, enqueue chunk jobs 1..N-1 (or finalize if N=1)                                     |
| `speech-tts-chunk`    | `app/api/queues/speech-tts-chunk/route.ts`    | 10             | One Modal call per message; upload temp WAV on success; mark chunk `done` or `failed`; increment `settledChunks`; run settlement gate |
| `speech-tts-finalize` | `app/api/queues/speech-tts-finalize/route.ts` | 1              | Download ordered chunk WAVs, `concatWavBuffers`, build alignment, upload final file, set `finished`, delete temp keys                 |

Chunk concurrency 10 aligns with Modal `@modal.concurrent(max_inputs=10)`. Start concurrency 1 avoids many parallel cold starts across speeches.

**Alternative:** Single long-running job with in-process `Promise.all` batches — rejected; still hits Vercel `maxDuration` on very long scripts.

**Alternative:** Unlimited parallel chunk fan-out from create — rejected; multiple Modal cold starts on parallel requests.

### Completion gate (settlement)

Each chunk job ends in `done` or `failed`. After either outcome, atomically increment `Speech.settledChunks`. The speech SHALL remain `processing` until `settledChunks === totalChunks`.

When all chunks are settled:

- If **any** `SpeechChunk` has `status` `failed` → set speech `processStatus` to `failed` with a user-safe `errorMessage` (summarize failed chunk count or first error). Do **not** enqueue finalize.
- If **all** chunks are `done` → enqueue `speech-tts-finalize`.

In-flight chunk jobs SHALL continue even after another chunk fails; no early speech-level `failed` until every chunk has settled.

The start job is the only exception: if chunk 0 fails before fan-out (no other chunk messages queued), the speech MAY be marked `failed` immediately because no parallel chunk work is in flight.

**Alternative:** Fail speech on first chunk error — rejected; wastes in-flight Modal work and prevents a clean “all chunks attempted” boundary before retry.

### Aggregation (finalize)

Reuse existing helpers:

1. Load `SpeechChunk` rows ordered by `chunkIndex`.
2. Read temp WAV buffers from the configured storage driver (R2 or local) using each chunk’s `tempR2Key`.
3. `concatWavBuffers(buffers, CHUNK_JOIN_GAP_MS)`.
4. Build alignment segments from stored `text` + `durationMs` (same logic as `generateLongSpeech` loop).
5. `uploadObject(speech.r2ObjectKey, finalWav)`.
6. Update `Speech`: `alignment`, `processStatus: finished`.
7. Delete temp chunk objects.

### Create API rewrite

`speeches.create` accepts only `voiceId`, `scriptId`, `language`, TTS params. Server generates `id` (UUID), sets `r2ObjectKey = speeches/{id}.wav`, `processStatus: pending`, `contentLength` from script, persists row, enqueues start job, returns speech. No client `alignment`, no storage existence check at create time.

### Retry API

`speeches.retry({ id })` allowed when `processStatus === failed`. Sets `pending`, clears `errorMessage`, resets chunk rows and counters, deletes temp chunk files if any, re-enqueues start job.

### Remove preview and client upload from CMS flow

Remove `speeches.generatePreview` and `speeches.getUploadUrl` from the router (or mark deprecated and unused). Create page becomes config + single Create button.

### getById audio URL gating

Return `audioUrl` only when `processStatus === finished` and final object exists. Return `processStatus` and `errorMessage` always.

### Local development

Install `@vercel/queue`. Document `vercel link` + `vercel env pull` for OIDC. Queue handlers callable via `next dev` / `vercel dev` per Vercel docs.

### vercel.json

```json
{
  "functions": {
    "app/api/queues/speech-tts-start/route.ts": {
      "maxDuration": 180,
      "experimentalTriggers": [
        {
          "type": "queue/v2beta",
          "topic": "speech-tts-start",
          "maxConcurrency": 1
        }
      ]
    },
    "app/api/queues/speech-tts-chunk/route.ts": {
      "maxDuration": 120,
      "experimentalTriggers": [
        {
          "type": "queue/v2beta",
          "topic": "speech-tts-chunk",
          "maxConcurrency": 10
        }
      ]
    },
    "app/api/queues/speech-tts-finalize/route.ts": {
      "maxDuration": 120,
      "experimentalTriggers": [
        {
          "type": "queue/v2beta",
          "topic": "speech-tts-finalize",
          "maxConcurrency": 1
        }
      ]
    }
  }
}
```

## Risks / Trade-offs

| Risk                                                           | Mitigation                                                                                                                              |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Chunk job fails mid-speech                                     | Mark chunk `failed`, keep speech `processing` until all chunks settle; then speech `failed`; user retries full run via `speeches.retry` |
| Duplicate finalize messages                                    | Finalize idempotent on `finished`; overwrite same final key                                                                             |
| Start topic maxConcurrency 1 queues multiple users' start jobs | Acceptable for v1; Modal warmup benefit outweighs slight queue delay                                                                    |
| Temp chunk files orphaned on failure                           | Retry and finalize cleanup delete temp keys; optional periodic cleanup later                                                            |
| Queue unavailable locally without Vercel OIDC                  | Document setup; consider dev fallback that runs start handler inline (optional, not in v1)                                              |
| Existing speeches without status                               | Migration default: `finished` where `alignment` or final object exists, else `failed`                                                   |

## Migration Plan

1. Deploy Prisma migration (new fields + `SpeechChunk` table; backfill existing rows as `finished`).
2. Deploy queue routes + `vercel.json` with Queues enabled on Vercel project.
3. Deploy API and UI changes together (create flow depends on queue).
4. Rollback: revert UI to prior version; speeches stuck in `processing` may need manual status fix (document ops note).

## Open Questions

- None blocking v1. Optional follow-up: Modal `min_containers=1` to reduce cold start; chunk progress UI (e.g. "3/12 chunks") using `completedChunks` / `totalChunks`.
