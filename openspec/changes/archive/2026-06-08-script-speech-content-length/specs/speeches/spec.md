## MODIFIED Requirements

### Requirement: Speech metadata model

The system SHALL persist speech metadata in PostgreSQL using a Prisma `Speech` model with fields: `id`, `voiceId` (required FK to `Voice`), `scriptId` (required FK to `Script`), `language`, `contentLength` (integer, non-null, character count of the script content at speech creation time), TTS parameters (`temperature`, `topP`, `topK`, `repetitionPenalty`, `normLoudness`), `r2ObjectKey` (storage key for generated WAV), required `userId` (FK to `User`), `createdAt`, and `updatedAt`. There SHALL be no system-generated speeches; every speech row MUST have a `userId`.

#### Scenario: Speech with voice and script links

- **WHEN** a speech row exists with valid `voiceId`, `scriptId`, `userId`, `contentLength`, and `r2ObjectKey`
- **THEN** the speech is valid and listable with resolvable voice and script relations

### Requirement: Speech create API

The system SHALL expose a tRPC `speeches.create` mutation that accepts `id`, `r2ObjectKey`, `voiceId`, `scriptId`, `language`, and TTS parameters with the same validation as preview generation. The `r2ObjectKey` MUST match `speeches/{id}.wav` for the provided `id`. On success the procedure SHALL verify the object exists in the configured storage driver, compute `contentLength` from the linked script's `content.length` server-side, persist the `Speech` row with the provided `id`, computed `contentLength`, and `userId` from the authenticated session, and return the created speech. The procedure SHALL NOT accept base64 audio, SHALL NOT upload or generate audio server-side, and SHALL NOT accept `contentLength` from the client.

#### Scenario: Successful create with pre-uploaded audio

- **WHEN** an authenticated client calls `speeches.create` with valid matching voice, script, language, TTS parameters, `id`, and `r2ObjectKey` where the WAV object already exists at `r2ObjectKey`
- **THEN** a speech row is created with the caller's `userId`, the provided `id` and `r2ObjectKey`, `contentLength` set to the character count of the linked script's content at save time, and the created row is returned

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
