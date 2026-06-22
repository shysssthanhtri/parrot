## MODIFIED Requirements

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
