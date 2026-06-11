## ADDED Requirements

### Requirement: Start job records processing start time

When the start job transitions a speech from `pending` to `processing`, the system SHALL set `processingStartedAt` on the speech row to the current time in the same update that sets `processStatus` to `processing`.

#### Scenario: Processing start timestamp set on start job

- **WHEN** `runSpeechTtsStart` begins processing for a pending speech
- **THEN** `processingStartedAt` is persisted alongside `processStatus` `processing`

### Requirement: Regenerate restarts TTS pipeline

When `speeches.regenerate` is invoked for an eligible speech (`finished`, `pending`, `failed`, or eligible `processing`), the system SHALL delete all `SpeechChunk` rows, delete all temp chunk R2 objects referenced by those rows, delete the final WAV at `r2ObjectKey` when present, clear stored alignment, reset `settledChunks` and `totalChunks`, clear `processingStartedAt`, set `processStatus` to `pending`, clear `errorMessage`, and publish a new `speech-tts-start` message for that speech id so the full script is processed again from chunk 0.

#### Scenario: Regenerate restarts from chunk zero

- **WHEN** `speeches.regenerate` succeeds for an eligible speech
- **THEN** all prior chunk artifacts are removed and processing restarts from the start job including chunk 0 warmup

#### Scenario: Regenerate removes all temp chunk files

- **WHEN** `speeches.regenerate` runs against a speech with existing `SpeechChunk` rows
- **THEN** every `tempR2Key` on those rows is deleted from storage before chunk rows are removed
