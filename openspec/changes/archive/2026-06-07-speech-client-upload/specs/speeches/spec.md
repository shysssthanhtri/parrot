## ADDED Requirements

### Requirement: Speech upload URL API

The system SHALL expose a tRPC `speeches.getUploadUrl` mutation that generates a new speech `id` (UUID), returns `r2ObjectKey` as `speeches/{id}.wav`, and returns a client-uploadable URL and HTTP method for uploading the WAV with `Content-Type: audio/wav`. When `STORAGE_DRIVER` is `r2`, the upload URL SHALL be a presigned PUT URL. When `STORAGE_DRIVER` is `local`, the upload URL SHALL target an authenticated local upload route that writes to the local storage driver. The procedure SHALL NOT create a speech database row.

#### Scenario: Get upload URL for R2

- **WHEN** an authenticated client calls `speeches.getUploadUrl` with `STORAGE_DRIVER` set to `r2`
- **THEN** the response includes `id`, `r2ObjectKey` matching `speeches/{id}.wav`, a presigned PUT `uploadUrl`, and `method` `PUT`

#### Scenario: Get upload URL for local storage

- **WHEN** an authenticated client calls `speeches.getUploadUrl` with `STORAGE_DRIVER` set to `local`
- **THEN** the response includes `id`, `r2ObjectKey`, a local `uploadUrl`, and `method` `PUT`

## MODIFIED Requirements

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
