# speeches Specification

## Purpose

TBD - created by archiving change speeches. Update Purpose after archive.

## Requirements

### Requirement: Speech metadata model

The system SHALL persist speech metadata in PostgreSQL using a Prisma `Speech` model with fields: `id`, `voiceId` (required FK to `Voice`), `scriptId` (required FK to `Script`), `language`, TTS parameters (`temperature`, `topP`, `topK`, `repetitionPenalty`, `normLoudness`), `r2ObjectKey` (storage key for generated WAV), required `userId` (FK to `User`), `createdAt`, and `updatedAt`. There SHALL be no system-generated speeches; every speech row MUST have a `userId`.

#### Scenario: Speech with voice and script links

- **WHEN** a speech row exists with valid `voiceId`, `scriptId`, `userId`, and `r2ObjectKey`
- **THEN** the speech is valid and listable with resolvable voice and script relations

### Requirement: Speeches list API

The system SHALL expose a tRPC `speeches.list` query that returns all speeches ordered for CMS display (by `updatedAt` descending), including voice name and script title for display.

#### Scenario: List all speeches

- **WHEN** an authenticated CMS client calls `speeches.list`
- **THEN** all speech rows are returned with associated voice name and script title

### Requirement: Speech detail API

The system SHALL expose a tRPC `speeches.getById` query that returns a single speech by `id` with voice and script relations, a resolved audio preview URL from storage, or reports not found.

#### Scenario: Unknown speech id

- **WHEN** `speeches.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error

#### Scenario: Detail includes audio URL

- **WHEN** `speeches.getById` is called for a speech with `r2ObjectKey` set
- **THEN** the response includes a playable audio URL resolved via the configured storage driver

### Requirement: Speech preview generation API

The system SHALL expose a tRPC `speeches.generatePreview` mutation that accepts `voiceId`, `scriptId`, `language`, and TTS parameters. The procedure SHALL validate that the voice and script exist, that their `language` values match the requested `language`, and that the voice has `r2ObjectKey` set. It SHALL call the Chatterbox TTS client with `prompt` equal to the script content and `voice_key` equal to the voice's `r2ObjectKey`, then return the generated WAV as base64 without persisting a speech row.

#### Scenario: Successful preview

- **WHEN** an authenticated client calls `speeches.generatePreview` with a matching voice, script, and language where the voice has audio
- **THEN** non-empty WAV audio is returned as base64 and no speech row is created

#### Scenario: Preview rejects voice without audio

- **WHEN** `speeches.generatePreview` is called for a voice with null `r2ObjectKey`
- **THEN** the procedure returns a validation error and no TTS call is made

#### Scenario: Preview rejects language mismatch

- **WHEN** `speeches.generatePreview` is called with a language that does not match the selected voice or script
- **THEN** the procedure returns a validation error

### Requirement: Speech create API

The system SHALL expose a tRPC `speeches.create` mutation that accepts `id`, `r2ObjectKey`, `voiceId`, `scriptId`, `language`, and TTS parameters with the same validation as preview generation. The `r2ObjectKey` MUST match `speeches/{id}.wav` for the provided `id`. On success the procedure SHALL verify the object exists in the configured storage driver, persist the `Speech` row with the provided `id` and `userId` from the authenticated session, and return the created speech. The procedure SHALL NOT accept base64 audio and SHALL NOT upload or generate audio server-side.

#### Scenario: Successful create with pre-uploaded audio

- **WHEN** an authenticated client calls `speeches.create` with valid matching voice, script, language, TTS parameters, `id`, and `r2ObjectKey` where the WAV object already exists at `r2ObjectKey`
- **THEN** a speech row is created with the caller's `userId` and the provided `id` and `r2ObjectKey`, and the created row is returned

#### Scenario: Create rejects missing object

- **WHEN** `speeches.create` is called with a valid key format but no object exists at `r2ObjectKey`
- **THEN** the procedure returns a validation error and no speech row is created

#### Scenario: Create rejects invalid key format

- **WHEN** `speeches.create` is called where `r2ObjectKey` does not match `speeches/{id}.wav`
- **THEN** the procedure returns a validation error

#### Scenario: Create uses local storage in development

- **WHEN** `STORAGE_DRIVER` is `local`, the client has uploaded via the local upload URL, and `speeches.create` succeeds
- **THEN** the speech row references a key retrievable via the local audio URL helper

#### Scenario: Create uses R2 in production

- **WHEN** `STORAGE_DRIVER` is `r2`, the client has uploaded via presigned PUT, and `speeches.create` succeeds
- **THEN** the speech row references a key retrievable via presigned GET URL

### Requirement: Speech TTS parameter validation

`speeches.generatePreview` and `speeches.create` SHALL validate TTS parameters against the shared slider bounds: `temperature` 0–2, `topP` 0–1, `topK` 1–10000, `repetitionPenalty` 1–2, and `normLoudness` boolean.

#### Scenario: Out-of-range temperature rejected

- **WHEN** either mutation is called with `temperature` outside 0–2
- **THEN** the procedure returns a validation error

### Requirement: Speech upload URL API

The system SHALL expose a tRPC `speeches.getUploadUrl` mutation that generates a new speech `id` (UUID), returns `r2ObjectKey` as `speeches/{id}.wav`, and returns a client-uploadable URL and HTTP method for uploading the WAV with `Content-Type: audio/wav`. When `STORAGE_DRIVER` is `r2`, the upload URL SHALL be a presigned PUT URL. When `STORAGE_DRIVER` is `local`, the upload URL SHALL target an authenticated local upload route that writes to the local storage driver. The procedure SHALL NOT create a speech database row.

#### Scenario: Get upload URL for R2

- **WHEN** an authenticated client calls `speeches.getUploadUrl` with `STORAGE_DRIVER` set to `r2`
- **THEN** the response includes `id`, `r2ObjectKey` matching `speeches/{id}.wav`, a presigned PUT `uploadUrl`, and `method` `PUT`

#### Scenario: Get upload URL for local storage

- **WHEN** an authenticated client calls `speeches.getUploadUrl` with `STORAGE_DRIVER` set to `local`
- **THEN** the response includes `id`, `r2ObjectKey`, a local `uploadUrl`, and `method` `PUT`
