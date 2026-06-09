## MODIFIED Requirements

### Requirement: Speech metadata model

The system SHALL persist speech metadata in PostgreSQL using a Prisma `Speech` model with fields: `id`, `voiceId` (required FK to `Voice`), `scriptId` (required FK to `Script`), `language`, `contentLength` (integer, non-null, character count of the script content at speech creation time), TTS parameters (`temperature`, `topP`, `topK`, `repetitionPenalty`, `normLoudness`), `r2ObjectKey` (storage key for generated WAV), `alignment` (JSON, nullable, chunk-level audio–text timing captured at generation time), required `userId` (FK to `User`), `createdAt`, and `updatedAt`. There SHALL be no system-generated speeches; every speech row MUST have a `userId`.

#### Scenario: Speech with voice and script links

- **WHEN** a speech row exists with valid `voiceId`, `scriptId`, `userId`, `contentLength`, and `r2ObjectKey`
- **THEN** the speech is valid and listable with resolvable voice and script relations

#### Scenario: Speech stores alignment on create

- **WHEN** a speech is created with valid alignment from preview generation
- **THEN** the row persists the alignment JSON for later detail and consumer use

### Requirement: Speech detail API

The system SHALL expose a tRPC `speeches.getById` query that returns a single speech by `id` with voice and script relations (including script `content`), stored `alignment` when present, a resolved audio preview URL from storage, or reports not found.

#### Scenario: Unknown speech id

- **WHEN** `speeches.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error

#### Scenario: Detail includes audio URL

- **WHEN** `speeches.getById` is called for a speech with `r2ObjectKey` set
- **THEN** the response includes a playable audio URL resolved via the configured storage driver

#### Scenario: Detail includes alignment and script content

- **WHEN** `speeches.getById` is called for a speech with stored alignment
- **THEN** the response includes `alignment` and the linked script's full `content` for synchronized display

### Requirement: Speech preview generation API

The system SHALL expose a tRPC `speeches.generatePreview` mutation that accepts `voiceId`, `scriptId`, `language`, and TTS parameters. The procedure SHALL validate that the voice and script exist, that their `language` values match the requested `language`, and that the voice has `r2ObjectKey` set. It SHALL synthesize audio for the full script content by splitting long text into TTS-safe chunks, calling the Chatterbox TTS client once per chunk with the same `voice_key` and generation parameters, concatenating the returned WAV segments, capturing chunk-level `SpeechScriptAlignment` from per-chunk WAV durations, and returning the combined WAV as base64 and the alignment without persisting a speech row.

#### Scenario: Successful preview

- **WHEN** an authenticated client calls `speeches.generatePreview` with a matching voice, script, and language where the voice has audio
- **THEN** non-empty WAV audio is returned as base64 with chunk alignment covering the full script content and no speech row is created

#### Scenario: Long script preview is complete

- **WHEN** `speeches.generatePreview` is called for a script longer than a single Chatterbox prompt can faithfully synthesize
- **THEN** the returned audio reflects the entire script content, not only the first segment, and alignment contains one segment per TTS chunk

#### Scenario: Preview rejects voice without audio

- **WHEN** `speeches.generatePreview` is called for a voice with null `r2ObjectKey`
- **THEN** the procedure returns a validation error and no TTS call is made

#### Scenario: Preview rejects language mismatch

- **WHEN** `speeches.generatePreview` is called with a language that does not match the selected voice or script
- **THEN** the procedure returns a validation error

### Requirement: Speech create API

The system SHALL expose a tRPC `speeches.create` mutation that accepts `id`, `r2ObjectKey`, `voiceId`, `scriptId`, `language`, TTS parameters, and `alignment` (required `SpeechScriptAlignment` from the preview used for upload) with the same validation as preview generation. The `r2ObjectKey` MUST match `speeches/{id}.wav` for the provided `id`. On success the procedure SHALL verify the object exists in the configured storage driver, validate alignment shape and consistency with the linked script content, compute `contentLength` from the linked script's `content.length` server-side, persist the `Speech` row with the provided `id`, computed `contentLength`, `alignment`, and `userId` from the authenticated session, and return the created speech. The procedure SHALL NOT accept base64 audio, SHALL NOT upload or generate audio server-side, and SHALL NOT accept `contentLength` from the client.

#### Scenario: Successful create with pre-uploaded audio

- **WHEN** an authenticated client calls `speeches.create` with valid matching voice, script, language, TTS parameters, `id`, `r2ObjectKey`, and preview alignment where the WAV object already exists at `r2ObjectKey`
- **THEN** a speech row is created with the caller's `userId`, the provided `id`, `r2ObjectKey`, `alignment`, `contentLength` set to the character count of the linked script's content at save time, and the created row is returned

#### Scenario: Create rejects missing object

- **WHEN** `speeches.create` is called with a valid key format but no object exists at `r2ObjectKey`
- **THEN** the procedure returns a validation error and no speech row is created

#### Scenario: Create rejects invalid key format

- **WHEN** `speeches.create` is called where `r2ObjectKey` does not match `speeches/{id}.wav`
- **THEN** the procedure returns a validation error

#### Scenario: Create rejects invalid alignment

- **WHEN** `speeches.create` is called with alignment that is malformed, non-contiguous, or whose segment texts do not match the linked script content
- **THEN** the procedure returns a validation error and no speech row is created

#### Scenario: Create uses local storage in development

- **WHEN** `STORAGE_DRIVER` is `local`, the client has uploaded via the local upload URL, and `speeches.create` succeeds
- **THEN** the speech row references a key retrievable via the local audio URL helper

#### Scenario: Create uses R2 in production

- **WHEN** `STORAGE_DRIVER` is `r2`, the client has uploaded via presigned PUT, and `speeches.create` succeeds
- **THEN** the speech row references a key retrievable via presigned GET URL
