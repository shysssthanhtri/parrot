# speeches Specification

## Purpose

TBD - created by archiving change speeches. Update Purpose after archive.

## Requirements

### Requirement: Speech metadata model

The system SHALL persist speech metadata in PostgreSQL using a Prisma `Speech` model with fields: `id`, `voiceId` (required FK to `Voice`), `scriptId` (required FK to `Script`), `language`, `contentLength` (integer, non-null, character count of the script content at speech creation time), TTS parameters (`temperature`, `topP`, `topK`, `repetitionPenalty`, `normLoudness`), `r2ObjectKey` (storage key for the final generated WAV, pre-assigned at create as `speeches/{id}.wav`), `alignment` (JSON, nullable, chunk-level audio–text timing set when processing finishes), `thumbnailR2ObjectKey` (nullable string, assigned when thumbnail processing starts), required `userId` (FK to `User`), `createdAt`, and `updatedAt`. The system SHALL persist an optional one-to-one `SpeechTtsGeneration` relation for TTS job state and an optional one-to-one `SpeechThumbnailGeneration` relation for thumbnail job state. There SHALL be no system-generated speeches; every speech row MUST have a `userId`.

#### Scenario: Speech with voice and script links

- **WHEN** a speech row exists with valid `voiceId`, `scriptId`, `userId`, `contentLength`, and `r2ObjectKey`
- **THEN** the speech is valid and listable with resolvable voice and script relations

#### Scenario: Speech stores alignment when processing finishes

- **WHEN** background TTS processing completes successfully for a speech
- **THEN** the row persists the alignment JSON and `SpeechTtsGeneration.status` is `finished`

### Requirement: Speeches list API

The system SHALL expose a tRPC `speeches.list` query that returns all speeches ordered for CMS display (by `updatedAt` descending), including voice name, script title, TTS generation status from linked `ttsGeneration` (`status`, optional `errorMessage`), and publication summary for display. Publication summary SHALL match the shape used by `speeches.getById`: `{ status: 'not_published' }` when no `SpeechPublication` row exists, or `{ status: 'published' | 'unpublished', publishedAt }` when a row exists.

#### Scenario: List all speeches

- **WHEN** an authenticated CMS client calls `speeches.list`
- **THEN** all speech rows are returned with associated voice name, script title, TTS generation status, and publication summary

#### Scenario: List includes published status

- **WHEN** `speeches.list` is called and a speech has publication `status` `published`
- **THEN** that row includes publication summary with `status` `published` and `publishedAt`

#### Scenario: List reports not published

- **WHEN** `speeches.list` is called and a speech has no publication row
- **THEN** that row includes publication summary with `status` `not_published`

### Requirement: Speech detail API

The system SHALL expose a tRPC `speeches.getById` query that returns a single speech by `id` with voice and script relations (including script `content`), linked `ttsGeneration` (`status`, optional `errorMessage`, optional `processingStartedAt`) when a generation row exists, stored `alignment` when present, linked `thumbnailGeneration` (`status`, optional `errorMessage`) when a generation row exists, a resolved thumbnail preview URL when `thumbnailGeneration.status` is `finished` and the thumbnail object exists at `thumbnailR2ObjectKey`, publication summary (`not_published`, or `published` / `unpublished` with optional `publishedAt`), `canRegenerate` reflecting publication guard rules, and a resolved audio preview URL from storage only when `ttsGeneration.status` is `finished` and the final object exists, or reports not found.

#### Scenario: Unknown speech id

- **WHEN** `speeches.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error

#### Scenario: Detail includes audio URL when finished

- **WHEN** `speeches.getById` is called for a speech with `ttsGeneration.status` `finished` and a final WAV at `r2ObjectKey`
- **THEN** the response includes a playable audio URL resolved via the configured storage driver

#### Scenario: Detail omits audio URL while processing

- **WHEN** `speeches.getById` is called for a speech with `ttsGeneration.status` `processing`
- **THEN** the response includes TTS generation status and does not include a playable audio URL

#### Scenario: Detail includes alignment and script content

- **WHEN** `speeches.getById` is called for a finished speech with stored alignment
- **THEN** the response includes `alignment` and the linked script's full `content` for synchronized display

#### Scenario: Detail includes publication summary

- **WHEN** `speeches.getById` is called for a speech with publication `status` `published`
- **THEN** the response includes publication status `published` and `publishedAt`

#### Scenario: Detail reports not published

- **WHEN** `speeches.getById` is called for a speech with no publication row
- **THEN** the response includes publication status `not_published`

#### Scenario: Detail includes thumbnail URL when finished

- **WHEN** `speeches.getById` is called for a speech whose `thumbnailGeneration.status` is `finished` and a thumbnail exists at `thumbnailR2ObjectKey`
- **THEN** the response includes a resolved thumbnail preview URL

### Requirement: Speech create API

The system SHALL expose a tRPC `speeches.create` mutation that accepts `voiceId`, `scriptId`, `language`, and TTS parameters with the same voice/script/language validation used for TTS generation. The server SHALL generate a new speech `id`, set `r2ObjectKey` to `speeches/{id}.wav`, compute `contentLength` from the linked script's `content.length`, persist the row with null `thumbnailR2ObjectKey`, `userId` from the authenticated session, start a TTS workflow, upsert `SpeechTtsGeneration` with `status` `processing` and the run's `workflowRunId`, start a thumbnail workflow, and upsert `SpeechThumbnailGeneration` with `status` `processing` and the run's `workflowRunId`. It SHALL return the created speech immediately without waiting for TTS or thumbnail generation to complete. The procedure SHALL NOT accept client-provided `id`, `r2ObjectKey`, `alignment`, or audio data.

#### Scenario: Successful async create

- **WHEN** an authenticated client calls `speeches.create` with valid matching voice, script, language, and TTS parameters
- **THEN** a speech row is created with pre-assigned `r2ObjectKey`, null `thumbnailR2ObjectKey`, the caller's `userId`, computed `contentLength`, a TTS workflow is started with a generation row in `processing`, a thumbnail workflow is started with a generation row in `processing`, and the created row is returned

#### Scenario: Create rejects voice without audio

- **WHEN** `speeches.create` is called for a voice with null `r2ObjectKey`
- **THEN** the procedure returns a validation error and no speech row is created

#### Scenario: Create rejects language mismatch

- **WHEN** `speeches.create` is called with a language that does not match the selected voice or script
- **THEN** the procedure returns a validation error and no speech row is created

### Requirement: Speech TTS parameter validation

`speeches.create` and `speeches.retry` SHALL validate TTS parameters against the shared slider bounds: `temperature` 0–2, `topP` 0–1, `topK` 1–10000, `repetitionPenalty` 1–2, and `normLoudness` boolean.

#### Scenario: Out-of-range temperature rejected

- **WHEN** `speeches.create` is called with `temperature` outside 0–2
- **THEN** the procedure returns a validation error

### Requirement: Speech retry API

The system SHALL expose a tRPC `speeches.retry` mutation that accepts a speech `id`. It SHALL succeed only when the speech exists and linked `ttsGeneration.status` is `failed` or `processing`. It SHALL best-effort cancel any in-flight TTS workflow when status is `processing`, delete temp chunk objects under `speeches/{id}/chunks/`, clear `errorMessage` on the generation row, preserve the final WAV and stored alignment, and start a new TTS workflow with an updated `workflowRunId` and `processingStartedAt`.

#### Scenario: Retry failed speech

- **WHEN** an authenticated CMS client calls `speeches.retry` for a speech with `ttsGeneration.status` `failed`
- **THEN** temp chunk objects are removed, a new TTS workflow is started, and the updated speech is returned

#### Scenario: Retry processing speech cancels and restarts

- **WHEN** `speeches.retry` is called for a speech with `ttsGeneration.status` `processing`
- **THEN** the in-flight workflow is cancelled (best-effort), a new TTS workflow is started, and the updated speech is returned

#### Scenario: Retry rejected when finished

- **WHEN** `speeches.retry` is called for a speech with `ttsGeneration.status` `finished`
- **THEN** the procedure returns a validation error

### Requirement: Speech delete API

The system SHALL expose a tRPC `speeches.delete` mutation that accepts a speech `id`. It SHALL succeed only when the speech exists and publication `status` is not `published`. It SHALL delete the `Speech` row (which cascades removal of linked `SpeechTtsGeneration`, `SpeechThumbnailGeneration`, and `SpeechPublication` rows when present), and SHALL delete all associated storage objects via the configured storage driver (R2 or local): the final WAV at `r2ObjectKey`, the thumbnail at `thumbnailR2ObjectKey` when present, and all temp chunk objects under `speeches/{id}/chunks/`. Deletion SHALL be allowed for any TTS generation status when not published. Linked `Voice` and `Script` rows SHALL NOT be deleted. The procedure SHALL return `{ success: true }` on completion.

#### Scenario: Delete finished speech with audio

- **WHEN** an authenticated CMS client calls `speeches.delete` for a speech with `ttsGeneration.status` `finished` and a final WAV at `r2ObjectKey`
- **THEN** the speech row and generation rows are removed, the final WAV, thumbnail when present, and temp chunk objects are deleted from storage, and `{ success: true }` is returned

#### Scenario: Delete speech with temp chunks only

- **WHEN** an authenticated CMS client calls `speeches.delete` for a speech with `ttsGeneration.status` `processing` and temp chunk objects but no final WAV yet
- **THEN** the speech row is removed and all temp chunk objects are deleted from storage

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

- `ttsGeneration.status` `finished` — always eligible.
- `ttsGeneration.status` `failed` — always eligible.
- `ttsGeneration.status` `processing` — eligible when `processingStartedAt` is null (legacy rows) or `processingStartedAt` is at least 30 minutes before the current time.

On success it SHALL best-effort cancel any in-flight TTS workflow when status is `processing`, delete all temp chunk objects under `speeches/{id}/chunks/`, delete the final WAV at `r2ObjectKey` when present, clear stored `alignment`, clear generation `errorMessage`, set a new `processingStartedAt`, and start a new TTS workflow with an updated `workflowRunId` and `status` `processing`. It SHALL return the updated speech row.

#### Scenario: Regenerate finished speech

- **WHEN** an authenticated CMS client calls `speeches.regenerate` for a speech with `ttsGeneration.status` `finished`
- **THEN** temp chunk objects are deleted, the final WAV is deleted when present, alignment is cleared, a new TTS workflow is started, and the updated speech is returned

#### Scenario: Regenerate stuck processing speech

- **WHEN** `speeches.regenerate` is called for a speech with `ttsGeneration.status` `processing` and `processingStartedAt` at least 30 minutes before now
- **THEN** temp chunk objects are deleted, the in-flight workflow is cancelled (best-effort), and a new TTS workflow is started

#### Scenario: Regenerate legacy processing speech without timestamp

- **WHEN** `speeches.regenerate` is called for a speech with `ttsGeneration.status` `processing` and null `processingStartedAt`
- **THEN** temp chunk objects are deleted and a new TTS workflow is started

#### Scenario: Regenerate rejected for recent processing

- **WHEN** `speeches.regenerate` is called for a speech with `ttsGeneration.status` `processing` and `processingStartedAt` less than 30 minutes before now
- **THEN** the procedure returns a validation error and no workflow is started

#### Scenario: Regenerate failed speech

- **WHEN** `speeches.regenerate` is called for a speech with `ttsGeneration.status` `failed`
- **THEN** temp chunk objects are deleted, generation `errorMessage` is cleared, and a new TTS workflow is started

#### Scenario: Regenerate unknown speech id

- **WHEN** `speeches.regenerate` is called with a non-existent id
- **THEN** the procedure returns a not-found error

#### Scenario: Regenerate rejected when published

- **WHEN** `speeches.regenerate` is called for a speech with publication `status` `published`
- **THEN** the procedure returns a validation error and no workflow is started

### Requirement: Speech publish readiness API

The system SHALL expose a tRPC `speeches.getPublishReadiness` query that accepts a speech `id` and returns a list of `{ code, message }` issues from an extensible server-side checker list. Checkers SHALL include at minimum: TTS generation `finished`, alignment present and valid, final audio object exists, and thumbnail generation `finished` with object in storage at `thumbnailR2ObjectKey`.

#### Scenario: Readiness lists multiple blockers

- **WHEN** `getPublishReadiness` is called for a speech with TTS generation `processing` and thumbnail generation `processing`
- **THEN** the response includes separate issues for each failed checker

#### Scenario: Readiness empty when publishable

- **WHEN** `getPublishReadiness` is called for a speech that passes all checkers
- **THEN** the response includes an empty issues list

### Requirement: Speech regenerate thumbnail API

The system SHALL expose a tRPC `speeches.regenerateThumbnail` mutation that accepts a speech `id` and an optional `extraPrompt` string. When provided, `extraPrompt` SHALL be trimmed; empty or whitespace-only values SHALL be treated as omitted. Non-empty `extraPrompt` values SHALL be at most 500 characters. The procedure SHALL succeed only when the speech exists and publication `status` is not `published`. It SHALL best-effort cancel any in-flight thumbnail workflow using the stored `workflowRunId`, delete any existing thumbnail object at `thumbnailR2ObjectKey` when present, set `thumbnailR2ObjectKey` to null, upsert `SpeechThumbnailGeneration` to `status` `processing` with a new `workflowRunId` and cleared `errorMessage`, and start a new thumbnail workflow passing the optional `extraPrompt` for that run only. It SHALL NOT persist `extraPrompt` on the speech or generation row. It SHALL NOT modify TTS state or enqueue TTS jobs.

#### Scenario: Manual thumbnail regenerate

- **WHEN** an authenticated CMS client calls `regenerateThumbnail` for an unpublished speech
- **THEN** `thumbnailR2ObjectKey` is null, a new thumbnail workflow is started, and `SpeechThumbnailGeneration.status` is `processing`

#### Scenario: Manual thumbnail regenerate with extra prompt

- **WHEN** an authenticated CMS client calls `regenerateThumbnail` with a non-empty `extraPrompt`
- **THEN** a new thumbnail workflow is started with that extra prompt available to prompt building for that run only and no `extraPrompt` field is stored on the speech or generation row

#### Scenario: Extra prompt omitted when empty

- **WHEN** an authenticated CMS client calls `regenerateThumbnail` with `extraPrompt` that is empty or whitespace only
- **THEN** the thumbnail workflow starts with the same prompt behavior as when `extraPrompt` is not supplied

#### Scenario: Thumbnail regenerate rejected when published

- **WHEN** `regenerateThumbnail` is called for a speech with publication `status` `published`
- **THEN** the procedure returns a validation error

#### Scenario: Extra prompt over limit rejected

- **WHEN** `regenerateThumbnail` is called with `extraPrompt` longer than 500 characters
- **THEN** the procedure returns a validation error
