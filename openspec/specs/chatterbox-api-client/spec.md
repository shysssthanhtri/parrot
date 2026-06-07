# chatterbox-api-client Specification

## Purpose

TBD - created by archiving change chatterbox-api-client. Update Purpose after archive.

## Requirements

### Requirement: Chatterbox OpenAPI snapshot

The system SHALL maintain a committed OpenAPI snapshot at `openapi/chatterbox.openapi.json` registered in `openapi/generate.config.json` with output `src/lib/chatterbox/schema.d.ts`.

#### Scenario: Snapshot matches live API contract

- **WHEN** the committed OpenAPI snapshot is compared to `{CHATTERBOX_API_URL}/openapi.json`
- **THEN** paths, request schemas (`TTSRequest`), and security scheme (`x-api-key`) match the deployed Modal API

#### Scenario: Chatterbox types generated via shared pipeline

- **WHEN** a developer runs `pnpm generate:api` (or `pnpm generate:api chatterbox`)
- **THEN** `src/lib/chatterbox/schema.d.ts` is updated from `openapi/chatterbox.openapi.json`

### Requirement: Server environment configuration

The system SHALL validate `CHATTERBOX_API_URL` (URL) and `CHATTERBOX_API_KEY` (non-empty string) in the server section of `src/lib/env.ts`. Both variables SHALL be documented in `.env.example`.

#### Scenario: Missing API key fails validation

- **WHEN** the application starts without `CHATTERBOX_API_KEY` set (and env validation is enabled)
- **THEN** startup fails with an environment validation error

#### Scenario: Invalid API URL fails validation

- **WHEN** `CHATTERBOX_API_URL` is not a valid URL
- **THEN** startup fails with an environment validation error

### Requirement: Typed Chatterbox HTTP client

The system SHALL expose a server-only module that creates an `openapi-fetch` client typed with the generated `paths` interface. The client SHALL use `CHATTERBOX_API_URL` as `baseUrl` and send `x-api-key: CHATTERBOX_API_KEY` on every request.

The module SHALL NOT be importable from client components (use `server-only` or equivalent project convention).

#### Scenario: Client targets configured base URL

- **WHEN** server code obtains the Chatterbox client
- **THEN** requests are sent to `CHATTERBOX_API_URL` with the API key header attached

#### Scenario: Generate speech is type-checked

- **WHEN** server code calls `POST /generate` with a `TTSRequest` body (`prompt`, `voice_key`, and optional generation parameters)
- **THEN** TypeScript enforces required fields and allowed types at compile time

### Requirement: Generate speech helper

The system SHALL provide a server-side helper to call `POST /generate` and return the synthesized audio as a `Buffer` (or `ArrayBuffer`) on HTTP 200 with `audio/wav` content type. On non-success responses, the helper SHALL throw an error that includes the HTTP status and a safe summary of the response body when available.

#### Scenario: Successful TTS generation

- **WHEN** `generate` is called with a valid `prompt` and `voice_key` that exists in R2
- **THEN** the helper returns non-empty WAV audio bytes

#### Scenario: Invalid API key

- **WHEN** `generate` is called with a misconfigured `CHATTERBOX_API_KEY`
- **THEN** the helper throws an error and does not return audio bytes

#### Scenario: Validation error from API

- **WHEN** `generate` is called with an empty `prompt` or missing `voice_key`
- **THEN** the helper throws an error reflecting the API validation failure (HTTP 422)
