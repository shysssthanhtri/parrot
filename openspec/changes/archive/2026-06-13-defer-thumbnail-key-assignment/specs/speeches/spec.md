## MODIFIED Requirements

### Requirement: Speech thumbnail metadata

The `Speech` model SHALL include `thumbnailR2ObjectKey` (nullable string), `thumbnailProcessStatus` (non-null string: `pending`, `processing`, `finished`, or `failed`, default `pending`), and optional `thumbnailErrorMessage`. On create `thumbnailR2ObjectKey` SHALL be null. The thumbnail queue worker SHALL assign `thumbnailR2ObjectKey` to `speeches/{id}/thumbnail.webp` when thumbnail processing starts.

#### Scenario: Create leaves thumbnail key null

- **WHEN** a speech row is created
- **THEN** `thumbnailR2ObjectKey` is null and `thumbnailProcessStatus` is `pending`

#### Scenario: Worker assigns key on process start

- **WHEN** the thumbnail queue worker begins processing a speech with null `thumbnailR2ObjectKey`
- **THEN** `thumbnailR2ObjectKey` is set to `speeches/{id}/thumbnail.webp` and `thumbnailProcessStatus` becomes `processing`

### Requirement: Speech create API

The system SHALL expose a tRPC `speeches.create` mutation that accepts `voiceId`, `scriptId`, `language`, and TTS parameters with the same voice/script/language validation used for TTS generation. The server SHALL generate a new speech `id`, set `r2ObjectKey` to `speeches/{id}.wav`, compute `contentLength` from the linked script's `content.length`, persist the row with `processStatus` `pending`, `thumbnailProcessStatus` `pending`, and null `thumbnailR2ObjectKey`, `userId` from the authenticated session, enqueue a `speech-tts-start` message, and enqueue a `speech-thumbnail` message. It SHALL return the created speech immediately without waiting for TTS or thumbnail generation to complete. The procedure SHALL NOT accept client-provided `id`, `r2ObjectKey`, `alignment`, or audio data.

#### Scenario: Successful async create

- **WHEN** an authenticated client calls `speeches.create` with valid matching voice, script, language, and TTS parameters
- **THEN** a speech row is created with `processStatus` `pending`, pre-assigned `r2ObjectKey`, null `thumbnailR2ObjectKey`, the caller's `userId`, computed `contentLength`, TTS and thumbnail jobs are enqueued, and the created row is returned

#### Scenario: Create rejects voice without audio

- **WHEN** `speeches.create` is called for a voice with null `r2ObjectKey`
- **THEN** the procedure returns a validation error and no speech row is created

#### Scenario: Create rejects language mismatch

- **WHEN** `speeches.create` is called with a language that does not match the selected voice or script
- **THEN** the procedure returns a validation error and no speech row is created

### Requirement: Speech regenerate thumbnail API

The system SHALL expose a tRPC `speeches.regenerateThumbnail` mutation that accepts a speech `id`. It SHALL succeed only when the speech exists and publication `status` is not `published`. It SHALL delete any existing thumbnail object at `thumbnailR2ObjectKey` when present, set `thumbnailR2ObjectKey` to null, reset `thumbnailProcessStatus` to `pending`, clear `thumbnailErrorMessage`, and enqueue a `speech-thumbnail` message. It SHALL NOT modify TTS state or enqueue TTS jobs.

#### Scenario: Manual thumbnail regenerate

- **WHEN** an authenticated CMS client calls `regenerateThumbnail` for an unpublished speech
- **THEN** `thumbnailR2ObjectKey` is null, a thumbnail job is enqueued, and `thumbnailProcessStatus` becomes `pending`

#### Scenario: Thumbnail regenerate rejected when published

- **WHEN** `regenerateThumbnail` is called for a speech with publication `status` `published`
- **THEN** the procedure returns a validation error
