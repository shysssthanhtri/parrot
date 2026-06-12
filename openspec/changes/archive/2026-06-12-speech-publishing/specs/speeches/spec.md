## MODIFIED Requirements

### Requirement: Speech detail API

The system SHALL expose a tRPC `speeches.getById` query that returns a single speech by `id` with voice and script relations (including script `content`), `processStatus`, optional `errorMessage`, `totalChunks`, `settledChunks`, stored `alignment` when present, publication summary (`not_published`, or `published` / `unpublished` with optional `publishedAt`), `canRegenerate` reflecting publication guard rules, and a resolved audio preview URL from storage only when `processStatus` is `finished` and the final object exists, or reports not found.

#### Scenario: Unknown speech id

- **WHEN** `speeches.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error

#### Scenario: Detail includes audio URL when finished

- **WHEN** `speeches.getById` is called for a speech with `processStatus` `finished` and a final WAV at `r2ObjectKey`
- **THEN** the response includes a playable audio URL resolved via the configured storage driver

#### Scenario: Detail omits audio URL while processing

- **WHEN** `speeches.getById` is called for a speech with `processStatus` `pending` or `processing`
- **THEN** the response includes `processStatus`, `totalChunks`, and `settledChunks`, and does not include a playable audio URL

#### Scenario: Detail includes alignment and script content

- **WHEN** `speeches.getById` is called for a finished speech with stored alignment
- **THEN** the response includes `alignment` and the linked script's full `content` for synchronized display

#### Scenario: Detail includes chunk counters while processing

- **WHEN** `speeches.getById` is called for a speech with `processStatus` `processing` and `totalChunks` greater than zero
- **THEN** the response includes current `settledChunks` and `totalChunks` values suitable for computing generation progress in the CMS

#### Scenario: Detail includes publication summary

- **WHEN** `speeches.getById` is called for a speech with publication `status` `published`
- **THEN** the response includes publication status `published` and `publishedAt`

#### Scenario: Detail reports not published

- **WHEN** `speeches.getById` is called for a speech with no publication row
- **THEN** the response includes publication status `not_published`

### Requirement: Speech delete API

The system SHALL expose a tRPC `speeches.delete` mutation that accepts a speech `id`. It SHALL succeed only when the speech exists and publication `status` is not `published`. It SHALL delete the `Speech` row (which cascades removal of all related `SpeechChunk` rows via the existing `onDelete: Cascade` foreign key and the linked `SpeechPublication` row when present), and SHALL delete all associated storage objects via the configured storage driver (R2 or local): the final WAV at `r2ObjectKey` and every temp chunk WAV referenced by deleted `SpeechChunk.tempR2Key` values. Deletion SHALL be allowed for any `processStatus` (`pending`, `processing`, `finished`, or `failed`) when not published. Linked `Voice` and `Script` rows SHALL NOT be deleted. The procedure SHALL return `{ success: true }` on completion.

#### Scenario: Delete finished speech with audio

- **WHEN** an authenticated CMS client calls `speeches.delete` for a speech with `processStatus` `finished` and a final WAV at `r2ObjectKey`
- **THEN** the speech row and all `SpeechChunk` rows are removed, the final WAV and any temp chunk objects are deleted from storage, and `{ success: true }` is returned

#### Scenario: Delete speech with temp chunks only

- **WHEN** an authenticated CMS client calls `speeches.delete` for a speech with `processStatus` `processing` and temp chunk objects but no final WAV yet
- **THEN** the speech row and chunk rows are removed and all temp chunk objects are deleted from storage

#### Scenario: Delete unknown speech id

- **WHEN** `speeches.delete` is called with a non-existent id
- **THEN** the procedure returns a not-found error and no storage objects are deleted

#### Scenario: Voice and script are preserved

- **WHEN** `speeches.delete` succeeds for a speech linked to a voice and script
- **THEN** the linked voice and script rows remain in the database

#### Scenario: Delete rejected when published

- **WHEN** `speeches.delete` is called for a speech with publication `status` `published`
- **THEN** the procedure returns a validation error and no rows or storage objects are deleted

### Requirement: Speech regenerate API

The system SHALL expose a tRPC `speeches.regenerate` mutation that accepts a speech `id`. It SHALL succeed when the speech exists, publication `status` is not `published`, and eligibility rules pass:

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

#### Scenario: Regenerate rejected when published

- **WHEN** `speeches.regenerate` is called for a speech with publication `status` `published`
- **THEN** the procedure returns a validation error and no jobs are enqueued
