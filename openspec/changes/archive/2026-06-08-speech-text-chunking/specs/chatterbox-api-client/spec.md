## MODIFIED Requirements

### Requirement: Generate speech helper

The system SHALL provide server-side helpers to call `POST /generate` and return synthesized audio as a `Buffer` on HTTP 200 with `audio/wav` content type. A single-chunk helper SHALL accept one `TTSRequest` body. A long-text helper SHALL accept the same generation parameters plus a full `prompt` string, split the prompt into chunks within the API length limit, call `POST /generate` once per chunk in order, concatenate the WAV responses, and return one combined `Buffer`. On non-success responses from any chunk, the helper SHALL throw an error that includes the HTTP status and a safe summary of the response body when available.

#### Scenario: Successful TTS generation

- **WHEN** `generate` is called with a valid `prompt` and `voice_key` that exists in R2
- **THEN** the helper returns non-empty WAV audio bytes

#### Scenario: Successful long-text generation

- **WHEN** the long-text helper is called with a prompt longer than one chunk and a valid `voice_key`
- **THEN** the helper issues one `POST /generate` per chunk and returns a single concatenated WAV buffer

#### Scenario: Invalid API key

- **WHEN** `generate` is called with a misconfigured `CHATTERBOX_API_KEY`
- **THEN** the helper throws an error and does not return audio bytes

#### Scenario: Validation error from API

- **WHEN** `generate` is called with an empty `prompt` or missing `voice_key`
- **THEN** the helper throws an error reflecting the API validation failure (HTTP 422)

#### Scenario: Chunk failure aborts long-text generation

- **WHEN** the long-text helper succeeds on earlier chunks but a later chunk returns a non-success response
- **THEN** the helper throws an error and does not return partial concatenated audio
