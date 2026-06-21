## REMOVED Requirements

### Requirement: Vercel Queue topics for speech TTS

**Reason**: TTS orchestration moves to Vercel Workflow; the three queue topics and route handlers are no longer used.

**Migration**: Remove `speech-tts-start`, `speech-tts-chunk`, and `speech-tts-finalize` from `vercel.json` and delete `src/app/api/queues/speech-tts-*/`. Producers call `start(speechTtsWorkflow, …)` instead of `send(...)`.

### Requirement: Start job orchestrates chunk plan and warmup

**Reason**: Replaced by a single TTS workflow with in-memory chunk planning and a warmup step for chunk 0.

**Migration**: Logic moves to `speechTtsWorkflow` steps in `src/workflows/speech-tts.ts`.

### Requirement: Chunk job synthesizes one segment

**Reason**: Chunk synthesis runs inside workflow batch steps instead of a separate queue consumer.

**Migration**: Parallel batch processing in `synthesizeInBatches` workflow step with batch size 10.

### Requirement: Settlement gate before finalize or speech failure

**Reason**: Fail-fast workflow stops on first chunk failure; finalize runs inline when all chunks succeed.

**Migration**: Remove `runSettlementGate` and `enqueueSpeechTtsFinalize`.

### Requirement: Finalize job aggregates chunk audio and alignment

**Reason**: Finalize is a workflow step, not a queue consumer.

**Migration**: `finalizeSpeechTtsStep` in workflow steps module.

### Requirement: Retry re-enqueues start job

**Reason**: Retry starts a TTS workflow and cancels any in-flight run; requirements move to `speeches` and workflow cancel specs.

**Migration**: Replace `enqueueSpeechTtsStart` with `startSpeechTtsWorkflow`.

### Requirement: Start job records processing start time

**Reason**: `processingStartedAt` moves to `SpeechTtsGeneration`.

**Migration**: Set on generation row when workflow processing starts.

### Requirement: Regenerate restarts TTS pipeline

**Reason**: Regenerate cancels workflow and starts a new run; requirements move to `speeches` and workflow cancel specs.

**Migration**: Replace queue enqueue with `startSpeechTtsWorkflow` after storage cleanup.

## ADDED Requirements

### Requirement: SpeechTtsGeneration persistence model

The system SHALL persist the latest TTS job state in PostgreSQL using a Prisma `SpeechTtsGeneration` model with fields: `id`, `speechId` (unique FK to `Speech`), `status` (enum: `processing`, `finished`, `failed`), optional `errorMessage`, optional `workflowRunId`, optional `processingStartedAt`, `createdAt`, and `updatedAt`. At most one row SHALL exist per speech.

#### Scenario: Generation row on create

- **WHEN** a speech is created and the TTS workflow is started
- **THEN** a `SpeechTtsGeneration` row exists with `status` `processing`, the started run's `workflowRunId`, and `processingStartedAt` set

#### Scenario: Generation row overwritten on restart

- **WHEN** `speeches.retry` or `speeches.regenerate` succeeds
- **THEN** the existing generation row is updated to `status` `processing` with a new `workflowRunId`, a new `processingStartedAt`, and cleared `errorMessage`

### Requirement: TTS workflow on speech create

When `speeches.create` succeeds, the system SHALL start a `speechTtsWorkflow` run for the new speech id in addition to the existing thumbnail workflow. The system SHALL upsert a `SpeechTtsGeneration` row with `status` `processing`, the new run's `workflowRunId`, and `processingStartedAt` before returning. The system SHALL NOT auto-start TTS workflows from thumbnail completion.

#### Scenario: Create starts TTS workflow

- **WHEN** an authenticated CMS client creates a speech
- **THEN** a TTS workflow is started for that speech id and a `SpeechTtsGeneration` row exists with `status` `processing`

### Requirement: TTS workflow processing

The system SHALL implement TTS generation as a Vercel Workflow (`workflow@^4.5.0`) with `'use workflow'` and `'use step'` functions. The workflow SHALL load the speech with voice and script relations, validate inputs, set `SpeechTtsGeneration.status` to `processing` and record `processingStartedAt`, split the script text with `splitTextForTts`, synthesize chunk index 0 via the Chatterbox Modal API (warmup), upload chunk 0 to `speeches/{speechId}/chunks/0.wav`, synthesize remaining chunks in batches of up to 10 concurrent Modal calls per batch, upload each chunk WAV to `speeches/{speechId}/chunks/{chunkIndex}.wav`, and on success concatenate chunk audio with `concatWavBuffers`, build alignment from chunk text and durations, upload the final WAV to `Speech.r2ObjectKey`, persist `Speech.alignment`, set `SpeechTtsGeneration.status` to `finished`, and delete temp chunk objects. On the first chunk failure the workflow SHALL set `SpeechTtsGeneration.status` to `failed` with a user-safe `errorMessage` and SHALL NOT process remaining batches. Before persisting success or failure, finalize and failure steps SHALL verify that the generation row's `workflowRunId` matches the current run id and SHALL skip updates when they differ.

#### Scenario: Successful TTS workflow for multi-chunk script

- **WHEN** the TTS workflow completes for a speech whose script splits into five chunks
- **THEN** the final WAV exists at `Speech.r2ObjectKey`, `Speech.alignment` is persisted, `SpeechTtsGeneration.status` is `finished`, and temp chunk objects are deleted

#### Scenario: Single-chunk script completes without batch step

- **WHEN** the TTS workflow runs for a speech whose script fits in one TTS chunk
- **THEN** only chunk 0 is synthesized, finalize runs, and `SpeechTtsGeneration.status` is `finished`

#### Scenario: Fail-fast on chunk failure

- **WHEN** chunk synthesis fails during batch processing and earlier chunks succeeded
- **THEN** `SpeechTtsGeneration.status` is `failed` with a user-safe `errorMessage` and remaining batches are not processed

#### Scenario: Stale run does not overwrite generation

- **WHEN** a cancelled or superseded workflow run reaches finalize or failure handling and the generation row's `workflowRunId` does not match the run id
- **THEN** the generation row and `Speech.alignment` / final WAV are not updated by that run

### Requirement: TTS workflow cancel on retry and regenerate

When `speeches.retry` or `speeches.regenerate` is invoked, the system SHALL best-effort cancel the previous workflow run via `getRun(storedWorkflowRunId).cancel()` when a `SpeechTtsGeneration` row exists with `status` `processing` and a non-null `workflowRunId`, then start a new workflow and update the generation row with the new `workflowRunId`, `status` `processing`, and a new `processingStartedAt`.

#### Scenario: Regenerate cancels in-flight TTS workflow

- **WHEN** `regenerate` is called while a TTS workflow is in progress
- **THEN** the previous run is cancelled (best-effort) and a new workflow is started with an updated `workflowRunId`

#### Scenario: Retry cancels in-flight TTS workflow

- **WHEN** `retry` is called for a speech with `ttsGeneration.status` `processing`
- **THEN** the previous run is cancelled (best-effort) and a new workflow is started

#### Scenario: Cancel failure does not block restart

- **WHEN** cancel throws because the previous run already completed or is not found
- **THEN** retry or regenerate still starts a new workflow and updates the generation row
