## ADDED Requirements

### Requirement: Voice metadata model

The system SHALL persist voice metadata in PostgreSQL using the Prisma `Voice` model with fields: `id`, `name`, `description`, `language` (default `en-US`), optional `r2ObjectKey`, optional `userId` (creator), `createdAt`, and `updatedAt`.

#### Scenario: Voice without audio file

- **WHEN** a voice row exists with `r2ObjectKey` null
- **THEN** the voice is valid and listable without an associated R2 object

### Requirement: R2 voice file storage

The system SHALL store voice audio files in Cloudflare R2 using the AWS S3 SDK with an R2-compatible endpoint. Upload and presigned read access SHALL be implemented in a shared server module.

#### Scenario: Seed uploads system voice file

- **WHEN** the seed script runs for a WAV in `./data/system-voices`
- **THEN** the file is uploaded to R2 and the voice row's `r2ObjectKey` is set to the object key

### Requirement: System voice seeding

The system SHALL provide `scripts/seed-system-voices.ts` that reads `./data/system-voices/*.wav`, uploads each file to R2, and upserts voice rows by stable `name` (derived from filename). Seeded system voices SHALL have `userId` null. The script SHALL be idempotent on re-run.

#### Scenario: Re-run seed

- **WHEN** the seed script runs again for an existing voice name
- **THEN** the corresponding voice row is updated without duplicating rows

### Requirement: Voices list API

The system SHALL expose a tRPC `voices.list` query that returns all voices ordered for CMS display (e.g. by `name` or `updatedAt`), with no filter on `userId`.

#### Scenario: List includes system and user voices

- **WHEN** an authenticated CMS client calls `voices.list`
- **THEN** all voice rows are returned regardless of `userId`

### Requirement: Voice detail API

The system SHALL expose a tRPC `voices.getById` query that returns a single voice by `id` or reports not found.

#### Scenario: Unknown voice id

- **WHEN** `voices.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error

### Requirement: Presigned audio URL for preview

When a voice has `r2ObjectKey` set, the system SHALL be able to generate a short-lived presigned GET URL for that object for CMS audio preview.

#### Scenario: Voice with r2ObjectKey

- **WHEN** detail flow requests preview for a voice with `r2ObjectKey`
- **THEN** a presigned URL is returned that allows the browser to play the audio
