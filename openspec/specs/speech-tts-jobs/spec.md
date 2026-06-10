# speech-tts-jobs Specification

## Purpose

TBD - created by archiving change async-speech-tts. Update Purpose after archive.

## Requirements

### Requirement: Vercel Queue topics for speech TTS

The system SHALL use `@vercel/queue` with three push-mode topics: `speech-tts-start`, `speech-tts-chunk`, and `speech-tts-finalize`. Each topic SHALL have a dedicated Next.js route handler registered in `vercel.json` with `experimentalTriggers` of type `queue/v2beta`. Topic `speech-tts-start` SHALL use `maxConcurrency` 1. Topic `speech-tts-chunk` SHALL use `maxConcurrency` 10. Topic `speech-tts-finalize` SHALL use `maxConcurrency` 1.

#### Scenario: Queue triggers configured at deploy

- **WHEN** the application is deployed to Vercel with Queues enabled
- **THEN** messages sent to each topic invoke the corresponding private route handler according to configured concurrency limits

### Requirement: Start job orchestrates chunk plan and warmup

The `speech-tts-start` consumer SHALL load the speech with voice and script relations, validate inputs, set `processStatus` to `processing`, split the script text with `splitTextForTts`, create one `SpeechChunk` row per segment with `chunkIndex`, `text`, and `tempR2Key` under `speeches/{speechId}/chunks/{chunkIndex}.wav`, set `totalChunks` on the speech, call Chatterbox TTS for chunk index 0 only, upload the resulting WAV to the chunk temp key via the configured storage driver (R2 or local), record `durationMs`, mark chunk 0 `done`, increment `settledChunks`, and enqueue one `speech-tts-chunk` message per remaining chunk index. When `totalChunks` is 1 and chunk 0 succeeds, it SHALL run the settlement gate (enqueue finalize when all chunks are `done`). When `totalChunks` is greater than 1, it SHALL not mark the speech `failed` or enqueue finalize until all chunks have settled.

#### Scenario: Long script fans out after chunk zero

- **WHEN** a start job runs for a speech whose script splits into five chunks
- **THEN** five `SpeechChunk` rows exist, chunk 0 is synthesized and stored, and four chunk topic messages are published for indices 1–4

#### Scenario: Single-chunk script skips chunk topic

- **WHEN** a start job runs for a speech whose script fits in one TTS chunk
- **THEN** chunk 0 is synthesized, `settledChunks` equals `totalChunks`, all chunks are `done`, and a finalize message is published without chunk topic messages

#### Scenario: Start job failure marks speech failed

- **WHEN** the start job fails on chunk 0 before any other chunk messages are published
- **THEN** the speech `processStatus` is set to `failed` with a user-safe `errorMessage` and chunk 0 is marked `failed`

### Requirement: Chunk job synthesizes one segment

The `speech-tts-chunk` consumer SHALL accept `{ speechId, chunkIndex }`, load the matching `SpeechChunk` and speech TTS parameters, call Chatterbox TTS once with the chunk `text`, and on success upload the WAV to `tempR2Key` via the configured storage driver (`uploadObject` — R2 in production, local in development), set `durationMs`, and mark the chunk `done`. On failure after queue retries are exhausted it SHALL mark the chunk `failed` without setting the speech to `failed` immediately. In either case it SHALL atomically increment `Speech.settledChunks` and run the settlement gate when `settledChunks` equals `totalChunks`.

#### Scenario: Chunk job completes and triggers finalize when all succeed

- **WHEN** the last chunk job for a speech succeeds and every chunk row is `done`
- **THEN** `settledChunks` equals `totalChunks`, the speech remains `processing` until the gate runs, and exactly one finalize message is enqueued

#### Scenario: Chunk job failure waits for other chunks

- **WHEN** a chunk job fails after retries are exhausted while other chunk jobs for the same speech are still in flight
- **THEN** that chunk row is marked `failed`, the speech `processStatus` remains `processing`, and other chunk jobs continue

#### Scenario: Speech fails after all chunks settle with failures

- **WHEN** every chunk for a speech has reached `done` or `failed` and at least one chunk is `failed`
- **THEN** the speech `processStatus` is set to `failed` with a user-safe `errorMessage` and finalize is not enqueued

### Requirement: Settlement gate before finalize or speech failure

When `settledChunks` equals `totalChunks` for a speech, the system SHALL evaluate all `SpeechChunk` rows. If every chunk is `done`, it SHALL enqueue `speech-tts-finalize`. If any chunk is `failed`, it SHALL set the speech to `failed` with a user-safe `errorMessage` and SHALL NOT enqueue finalize. The settlement gate SHALL be idempotent under concurrent chunk completions.

#### Scenario: Concurrent last chunks trigger gate once

- **WHEN** two chunk jobs for the same speech reach their terminal state at nearly the same time
- **THEN** the settlement gate runs safely and the speech ends in exactly one terminal outcome (`failed` or finalize enqueued)

### Requirement: Finalize job aggregates chunk audio and alignment

The `speech-tts-finalize` consumer SHALL load all `SpeechChunk` rows for the speech ordered by `chunkIndex`, verify every chunk is `done`, read each temp WAV from the configured storage driver (R2 or local) using `tempR2Key`, concatenate with `concatWavBuffers` using `CHUNK_JOIN_GAP_MS`, build `SpeechScriptAlignment` segments from stored chunk `text` and `durationMs` matching the contiguous rules in `speech-script-alignment`, upload the final WAV to `r2ObjectKey` via `uploadObject`, persist `alignment`, set `processStatus` to `finished`, and delete temp chunk objects from the same bucket/filesystem. If `processStatus` is already `finished`, it SHALL no-op. On failure after queue retries are exhausted it SHALL set the speech to `failed` with a user-safe `errorMessage`.

#### Scenario: Finalize uses R2 in production

- **WHEN** `STORAGE_DRIVER` is `r2` and finalize runs after all chunks are done
- **THEN** temp chunk objects are read from and deleted in R2 and the final WAV is uploaded to `speeches/{id}.wav` in the same bucket

#### Scenario: Successful finalize

- **WHEN** finalize runs after all chunks are done
- **THEN** the final WAV exists at `speeches/{id}.wav`, alignment covers the full script, and `processStatus` is `finished`

#### Scenario: Finalize job failure

- **WHEN** finalize fails after retries are exhausted
- **THEN** the speech is marked `failed` with a user-safe `errorMessage`

#### Scenario: Idempotent finalize retry

- **WHEN** finalize is delivered more than once for an already finished speech
- **THEN** the handler returns without error and does not corrupt stored audio or alignment

### Requirement: Retry re-enqueues start job

When `speeches.retry` is invoked for a failed speech, the system SHALL delete all `SpeechChunk` rows (or reset them to `pending`), clear temp chunk files, reset `settledChunks` and `totalChunks`, set `processStatus` to `pending`, clear `errorMessage`, and publish a new `speech-tts-start` message for that speech id so the full script is processed again from chunk 0.

#### Scenario: Retry after failure

- **WHEN** a CMS user retries a failed speech
- **THEN** processing restarts from the start job including chunk 0 warmup and all chunks are regenerated
