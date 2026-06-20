## MODIFIED Requirements

### Requirement: Speech metadata model

The system SHALL persist speech metadata in PostgreSQL using a Prisma `Speech` model with fields: `id`, `voiceId` (required FK to `Voice`), `scriptId` (required FK to `Script`), `language`, `contentLength` (integer, non-null, character count of the script content at speech creation time), TTS parameters (`temperature`, `topP`, `topK`, `repetitionPenalty`, `normLoudness`), `r2ObjectKey` (storage key for the final generated WAV, pre-assigned at create as `speeches/{id}.wav`), `alignment` (JSON, nullable, chunk-level audio–text timing set when processing finishes), `processStatus` (non-null string: `pending`, `processing`, `finished`, or `failed`, default `pending`), optional `errorMessage`, `totalChunks` (integer, non-null, default 0), `settledChunks` (integer, non-null, default 0; counts chunks that reached `done` or `failed`), `thumbnailR2ObjectKey` (nullable string, assigned when thumbnail processing starts), required `userId` (FK to `User`), `createdAt`, and `updatedAt`. The system SHALL also persist `SpeechChunk` rows linked to each speech with `chunkIndex`, `text`, `status` (`pending`, `done`, or `failed`), `tempR2Key`, and optional `durationMs` (set only when `done`). The system SHALL persist an optional one-to-one `SpeechThumbnailGeneration` relation for thumbnail job state. There SHALL be no system-generated speeches; every speech row MUST have a `userId`.

#### Scenario: Speech with voice and script links

- **WHEN** a speech row exists with valid `voiceId`, `scriptId`, `userId`, `contentLength`, and `r2ObjectKey`
- **THEN** the speech is valid and listable with resolvable voice and script relations

#### Scenario: Speech stores alignment when processing finishes

- **WHEN** background TTS processing completes successfully for a speech
- **THEN** the row persists the alignment JSON and `processStatus` is `finished`

### Requirement: Speech detail API

The system SHALL expose a tRPC `speeches.getById` query that returns a single speech by `id` with voice and script relations (including script `content`), `processStatus`, optional `errorMessage`, `totalChunks`, `settledChunks`, stored `alignment` when present, linked `thumbnailGeneration` (`status`, optional `errorMessage`) when a generation row exists, a resolved thumbnail preview URL when `thumbnailGeneration.status` is `finished` and the thumbnail object exists at `thumbnailR2ObjectKey`, publication summary (`not_published`, or `published` / `unpublished` with optional `publishedAt`), `canRegenerate` reflecting publication guard rules, and a resolved audio preview URL from storage only when `processStatus` is `finished` and the final object exists, or reports not found.

#### Scenario: Unknown speech id

- **WHEN** `speeches.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error

#### Scenario: Detail includes audio URL when finished

- **WHEN** `speeches.getById` is called for a speech with `processStatus` `finished` and a final WAV at `r2ObjectKey`
- **THEN** the response includes a playable audio URL resolved via the configured storage driver

#### Scenario: Detail omits audio URL while processing

- **WHEN** `speeches.getById` is called for a speech with `processStatus` `pending` or `processing`
- **THEN** the response includes `processStatus`, `totalChunks`, and `settledChunks`, and does not include a playable audio URL

#### Scenario: Detail includes alignment and script content

- **WHEN** `speeches.getById` is called for a finished speech with stored alignment
- **THEN** the response includes `alignment` and the linked script's full `content` for synchronized display

#### Scenario: Detail includes chunk counters while processing

- **WHEN** `speeches.getById` is called for a speech with `processStatus` `processing` and `totalChunks` greater than zero
- **THEN** the response includes current `settledChunks` and `totalChunks` values suitable for computing generation progress in the CMS

#### Scenario: Detail includes publication summary

- **WHEN** `speeches.getById` is called for a speech with publication `status` `published`
- **THEN** the response includes publication status `published` and `publishedAt`

#### Scenario: Detail reports not published

- **WHEN** `speeches.getById` is called for a speech with no publication row
- **THEN** the response includes publication status `not_published`

#### Scenario: Detail includes thumbnail URL when finished

- **WHEN** `speeches.getById` is called for a speech whose `thumbnailGeneration.status` is `finished` and a thumbnail exists at `thumbnailR2ObjectKey`
- **THEN** the response includes a resolved thumbnail preview URL

### Requirement: Speech create API

The system SHALL expose a tRPC `speeches.create` mutation that accepts `voiceId`, `scriptId`, `language`, and TTS parameters with the same voice/script/language validation used for TTS generation. The server SHALL generate a new speech `id`, set `r2ObjectKey` to `speeches/{id}.wav`, compute `contentLength` from the linked script's `content.length`, persist the row with `processStatus` `pending` and null `thumbnailR2ObjectKey`, `userId` from the authenticated session, enqueue a `speech-tts-start` message, start a thumbnail workflow, and upsert `SpeechThumbnailGeneration` with `status` `processing` and the run's `workflowRunId`. It SHALL return the created speech immediately without waiting for TTS or thumbnail generation to complete. The procedure SHALL NOT accept client-provided `id`, `r2ObjectKey`, `alignment`, or audio data.

#### Scenario: Successful async create

- **WHEN** an authenticated client calls `speeches.create` with valid matching voice, script, language, and TTS parameters
- **THEN** a speech row is created with `processStatus` `pending`, pre-assigned `r2ObjectKey`, null `thumbnailR2ObjectKey`, the caller's `userId`, computed `contentLength`, a TTS start job is enqueued, a thumbnail workflow is started with a generation row in `processing`, and the created row is returned

#### Scenario: Create rejects voice without audio

- **WHEN** `speeches.create` is called for a voice with null `r2ObjectKey`
- **THEN** the procedure returns a validation error and no speech row is created

#### Scenario: Create rejects language mismatch

- **WHEN** `speeches.create` is called with a language that does not match the selected voice or script
- **THEN** the procedure returns a validation error and no speech row is created

### Requirement: Speech publish readiness API

The system SHALL expose a tRPC `speeches.getPublishReadiness` query that accepts a speech `id` and returns a list of `{ code, message }` issues from an extensible server-side checker list. Checkers SHALL include at minimum: audio finished, alignment present and valid, final audio object exists, and thumbnail generation `finished` with object in storage at `thumbnailR2ObjectKey`.

#### Scenario: Readiness lists multiple blockers

- **WHEN** `getPublishReadiness` is called for a speech with unfinished audio and thumbnail generation `processing`
- **THEN** the response includes separate issues for each failed checker

#### Scenario: Readiness empty when publishable

- **WHEN** `getPublishReadiness` is called for a speech that passes all checkers
- **THEN** the response includes an empty issues list

### Requirement: Speech regenerate thumbnail API

The system SHALL expose a tRPC `speeches.regenerateThumbnail` mutation that accepts a speech `id`. It SHALL succeed only when the speech exists and publication `status` is not `published`. It SHALL best-effort cancel any in-flight thumbnail workflow using the stored `workflowRunId`, delete any existing thumbnail object at `thumbnailR2ObjectKey` when present, set `thumbnailR2ObjectKey` to null, upsert `SpeechThumbnailGeneration` to `status` `processing` with a new `workflowRunId` and cleared `errorMessage`, and start a new thumbnail workflow. It SHALL NOT modify TTS state or enqueue TTS jobs.

#### Scenario: Manual thumbnail regenerate

- **WHEN** an authenticated CMS client calls `regenerateThumbnail` for an unpublished speech
- **THEN** `thumbnailR2ObjectKey` is null, a new thumbnail workflow is started, and `SpeechThumbnailGeneration.status` is `processing`

#### Scenario: Thumbnail regenerate rejected when published

- **WHEN** `regenerateThumbnail` is called for a speech with publication `status` `published`
- **THEN** the procedure returns a validation error

## REMOVED Requirements

### Requirement: Speech thumbnail metadata

**Reason**: Thumbnail job lifecycle moves to `SpeechThumbnailGeneration`; `Speech` retains only `thumbnailR2ObjectKey` as the storage pointer.

**Migration**: Read thumbnail job status from `Speech.thumbnailGeneration` relation in APIs and CMS UI. Drop `thumbnailProcessStatus` and `thumbnailErrorMessage` columns from `Speech`.
