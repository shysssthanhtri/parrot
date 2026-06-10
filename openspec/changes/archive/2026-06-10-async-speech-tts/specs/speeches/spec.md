## MODIFIED Requirements

### Requirement: Speech metadata model

The system SHALL persist speech metadata in PostgreSQL using a Prisma `Speech` model with fields: `id`, `voiceId` (required FK to `Voice`), `scriptId` (required FK to `Script`), `language`, `contentLength` (integer, non-null, character count of the script content at speech creation time), TTS parameters (`temperature`, `topP`, `topK`, `repetitionPenalty`, `normLoudness`), `r2ObjectKey` (storage key for the final generated WAV, pre-assigned at create as `speeches/{id}.wav`), `alignment` (JSON, nullable, chunk-level audio–text timing set when processing finishes), `processStatus` (non-null string: `pending`, `processing`, `finished`, or `failed`, default `pending`), optional `errorMessage`, `totalChunks` (integer, non-null, default 0), `settledChunks` (integer, non-null, default 0; counts chunks that reached `done` or `failed`), required `userId` (FK to `User`), `createdAt`, and `updatedAt`. The system SHALL also persist `SpeechChunk` rows linked to each speech with `chunkIndex`, `text`, `status` (`pending`, `done`, or `failed`), `tempR2Key`, and optional `durationMs` (set only when `done`). There SHALL be no system-generated speeches; every speech row MUST have a `userId`.

#### Scenario: Speech with voice and script links

- **WHEN** a speech row exists with valid `voiceId`, `scriptId`, `userId`, `contentLength`, and `r2ObjectKey`
- **THEN** the speech is valid and listable with resolvable voice and script relations

#### Scenario: Speech stores alignment when processing finishes

- **WHEN** background TTS processing completes successfully for a speech
- **THEN** the row persists the alignment JSON and `processStatus` is `finished`

### Requirement: Speeches list API

The system SHALL expose a tRPC `speeches.list` query that returns all speeches ordered for CMS display (by `updatedAt` descending), including voice name, script title, and `processStatus` for display.

#### Scenario: List all speeches

- **WHEN** an authenticated CMS client calls `speeches.list`
- **THEN** all speech rows are returned with associated voice name, script title, and process status

### Requirement: Speech detail API

The system SHALL expose a tRPC `speeches.getById` query that returns a single speech by `id` with voice and script relations (including script `content`), `processStatus`, optional `errorMessage`, stored `alignment` when present, and a resolved audio preview URL from storage only when `processStatus` is `finished` and the final object exists, or reports not found.

#### Scenario: Unknown speech id

- **WHEN** `speeches.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error

#### Scenario: Detail includes audio URL when finished

- **WHEN** `speeches.getById` is called for a speech with `processStatus` `finished` and a final WAV at `r2ObjectKey`
- **THEN** the response includes a playable audio URL resolved via the configured storage driver

#### Scenario: Detail omits audio URL while processing

- **WHEN** `speeches.getById` is called for a speech with `processStatus` `pending` or `processing`
- **THEN** the response includes `processStatus` and does not include a playable audio URL

#### Scenario: Detail includes alignment and script content

- **WHEN** `speeches.getById` is called for a finished speech with stored alignment
- **THEN** the response includes `alignment` and the linked script's full `content` for synchronized display

### Requirement: Speech create API

The system SHALL expose a tRPC `speeches.create` mutation that accepts `voiceId`, `scriptId`, `language`, and TTS parameters with the same voice/script/language validation used for TTS generation. The server SHALL generate a new speech `id`, set `r2ObjectKey` to `speeches/{id}.wav`, compute `contentLength` from the linked script's `content.length`, persist the row with `processStatus` `pending`, `userId` from the authenticated session, and enqueue a `speech-tts-start` message. It SHALL return the created speech immediately without waiting for TTS to complete. The procedure SHALL NOT accept client-provided `id`, `r2ObjectKey`, `alignment`, or audio data.

#### Scenario: Successful async create

- **WHEN** an authenticated client calls `speeches.create` with valid matching voice, script, language, and TTS parameters
- **THEN** a speech row is created with `processStatus` `pending`, pre-assigned `r2ObjectKey`, the caller's `userId`, computed `contentLength`, a start job is enqueued, and the created row is returned

#### Scenario: Create rejects voice without audio

- **WHEN** `speeches.create` is called for a voice with null `r2ObjectKey`
- **THEN** the procedure returns a validation error and no speech row is created

#### Scenario: Create rejects language mismatch

- **WHEN** `speeches.create` is called with a language that does not match the selected voice or script
- **THEN** the procedure returns a validation error and no speech row is created

### Requirement: Speech TTS parameter validation

`speeches.create` and `speeches.retry` SHALL validate TTS parameters against the shared slider bounds: `temperature` 0–2, `topP` 0–1, `topK` 1–10000, `repetitionPenalty` 1–2, and `normLoudness` boolean.

#### Scenario: Out-of-range temperature rejected

- **WHEN** `speeches.create` is called with `temperature` outside 0–2
- **THEN** the procedure returns a validation error

## ADDED Requirements

### Requirement: Speech retry API

The system SHALL expose a tRPC `speeches.retry` mutation that accepts a speech `id`. It SHALL succeed only when the speech exists and `processStatus` is `failed`. It SHALL reset chunk progress, clear `errorMessage`, set `processStatus` to `pending`, and enqueue a new `speech-tts-start` message.

#### Scenario: Retry failed speech

- **WHEN** an authenticated CMS client calls `speeches.retry` for a speech with `processStatus` `failed`
- **THEN** the speech returns to `pending`, a start job is enqueued, and the updated speech is returned

#### Scenario: Retry rejected when not failed

- **WHEN** `speeches.retry` is called for a speech that is not in `failed` status
- **THEN** the procedure returns a validation error

## REMOVED Requirements

### Requirement: Speech preview generation API

**Reason**: TTS generation moved to async background jobs; the create page no longer previews before persisting.

**Migration**: Use `speeches.create` to enqueue processing and poll `speeches.getById` on the detail page until `processStatus` is `finished`.

### Requirement: Speech upload URL API

**Reason**: Final and temp chunk audio are uploaded server-side by queue consumers, not by the CMS client.

**Migration**: No client upload step; `speeches.create` pre-assigns the final storage key.
