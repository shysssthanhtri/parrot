## ADDED Requirements

### Requirement: Speech processing start timestamp

The `Speech` model SHALL include a nullable `processingStartedAt` (`DateTime`) field. When background TTS processing transitions a speech from `pending` to `processing` in the start job, the system SHALL set `processingStartedAt` to the current time. When a speech is reset to `pending` via `speeches.retry` or `speeches.regenerate`, the system SHALL clear `processingStartedAt` to null.

#### Scenario: Start job records processing start time

- **WHEN** the start job sets `processStatus` to `processing` for a speech
- **THEN** `processingStartedAt` is set to the current timestamp

#### Scenario: Reset clears processing start time

- **WHEN** `speeches.retry` or `speeches.regenerate` resets a speech to `pending`
- **THEN** `processingStartedAt` is null

### Requirement: Speech regenerate API

The system SHALL expose a tRPC `speeches.regenerate` mutation that accepts a speech `id`. It SHALL succeed when the speech exists and eligibility rules pass:

- `processStatus` `finished` — always eligible.
- `processStatus` `pending` — always eligible.
- `processStatus` `failed` — always eligible.
- `processStatus` `processing` — eligible when `processingStartedAt` is null (legacy rows) or `processingStartedAt` is at least 30 minutes before the current time.

On success it SHALL delete every temp chunk object referenced by existing `SpeechChunk` rows, delete the final WAV at `r2ObjectKey` when present, remove all `SpeechChunk` rows, clear stored `alignment`, reset `settledChunks` and `totalChunks` to 0, clear `errorMessage`, clear `processingStartedAt`, set `processStatus` to `pending`, and enqueue a new `speech-tts-start` message. It SHALL return the updated speech row.

#### Scenario: Regenerate finished speech

- **WHEN** an authenticated CMS client calls `speeches.regenerate` for a speech with `processStatus` `finished`
- **THEN** all chunk rows and associated temp R2 objects are deleted, the final WAV is deleted when present, the speech returns to `pending`, a start job is enqueued, and the updated speech is returned

#### Scenario: Regenerate pending speech

- **WHEN** an authenticated CMS client calls `speeches.regenerate` for a speech with `processStatus` `pending`
- **THEN** all existing chunk rows and temp R2 objects are deleted, the speech returns to `pending`, a start job is enqueued, and the updated speech is returned

#### Scenario: Regenerate stuck processing speech

- **WHEN** `speeches.regenerate` is called for a speech with `processStatus` `processing` and `processingStartedAt` at least 30 minutes before now
- **THEN** all chunk rows and temp R2 objects are deleted, progress counters are reset, the speech returns to `pending`, and a start job is enqueued

#### Scenario: Regenerate legacy processing speech without timestamp

- **WHEN** `speeches.regenerate` is called for a speech with `processStatus` `processing` and null `processingStartedAt`
- **THEN** all chunk rows and temp R2 objects are deleted, the speech returns to `pending`, and a start job is enqueued

#### Scenario: Regenerate rejected for recent processing

- **WHEN** `speeches.regenerate` is called for a speech with `processStatus` `processing` and `processingStartedAt` less than 30 minutes before now
- **THEN** the procedure returns a validation error and no jobs are enqueued

#### Scenario: Regenerate failed speech

- **WHEN** `speeches.regenerate` is called for a speech with `processStatus` `failed`
- **THEN** all chunk rows and temp R2 objects are deleted, `errorMessage` is cleared, the speech returns to `pending`, and a start job is enqueued

#### Scenario: Regenerate unknown speech id

- **WHEN** `speeches.regenerate` is called with a non-existent id
- **THEN** the procedure returns a not-found error
