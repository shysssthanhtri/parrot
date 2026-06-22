# speech-thumbnail-jobs Specification

## Purpose

TBD - created by archiving change speech-thumbnails. Update Purpose after archive.

## Requirements

### Requirement: Thumbnail generation on speech create

When `speeches.create` succeeds, the system SHALL start a `speechThumbnailWorkflow` run for the new speech id in addition to the existing TTS start job. The system SHALL upsert a `SpeechThumbnailGeneration` row with `status` `processing` and the new run's `workflowRunId` before returning. The system SHALL NOT auto-start thumbnail workflows from TTS finalize, `speeches.retry`, or `speeches.regenerate`.

#### Scenario: Create starts thumbnail workflow

- **WHEN** an authenticated CMS client creates a speech
- **THEN** a thumbnail workflow is started for that speech id and a `SpeechThumbnailGeneration` row exists with `status` `processing`

#### Scenario: Audio regenerate does not start thumbnail workflow

- **WHEN** `speeches.regenerate` succeeds for a speech
- **THEN** no thumbnail workflow is started

### Requirement: Thumbnail queue worker processing

The system SHALL implement thumbnail generation as a Vercel Workflow (`workflow@^4.5.0`) with `'use workflow'` and `'use step'` functions. The workflow SHALL accept a speech id and an optional extra prompt for manual regenerate runs. The workflow SHALL load the speech with linked script (title, content) and script topics (name, color), build a text prompt suitable for cover-art generation that reflects the script subject matter (no text in the image), assign `Speech.thumbnailR2ObjectKey` to `speeches/{id}/thumbnail.webp` when processing starts if not already set, call the Modal thumbnail API at the configured resolution 832×1088, upload the WebP result via the configured storage driver with content type `image/webp`, set `SpeechThumbnailGeneration.status` to `finished`, and clear `errorMessage`. The workflow SHALL NOT depend on native image libraries (e.g. `sharp`) for format conversion. On failure it SHALL set `SpeechThumbnailGeneration.status` to `failed` with a user-safe `errorMessage`. The workflow SHALL NOT fail when `thumbnailR2ObjectKey` is null at run start. The built prompt SHALL include a truncated excerpt of script content when present and SHALL stay within the Modal API prompt length limit (5000 characters). When an extra prompt is supplied for the run, the built prompt SHALL incorporate it as author direction in addition to title, topics, language, and script excerpt metadata. Before persisting success or failure, the finalize step SHALL verify that the generation row's `workflowRunId` matches the current run id and SHALL skip updates when they differ (stale run after cancel/regenerate).

#### Scenario: Successful thumbnail workflow

- **WHEN** the thumbnail workflow completes for a speech
- **THEN** the thumbnail object exists at `Speech.thumbnailR2ObjectKey` as WebP and `SpeechThumbnailGeneration.status` is `finished`

#### Scenario: Failed thumbnail workflow

- **WHEN** the thumbnail workflow fails in the generate or upload step
- **THEN** `SpeechThumbnailGeneration.status` is `failed` and `errorMessage` is set

#### Scenario: Workflow runs on Vercel linux-x64

- **WHEN** a thumbnail workflow step executes on Vercel production (linux-x64)
- **THEN** the step loads and executes without requiring the `sharp` native module

#### Scenario: Workflow assigns key for legacy speech

- **WHEN** the thumbnail workflow runs for a speech with null `thumbnailR2ObjectKey`
- **THEN** it assigns `speeches/{id}/thumbnail.webp` before calling the Modal API and does not throw a missing-key error

#### Scenario: Prompt includes script content

- **WHEN** the thumbnail workflow builds a prompt for a speech whose script has non-empty content
- **THEN** the prompt sent to the Modal API includes an excerpt of that script content in addition to title, topics, and language metadata

#### Scenario: Long script content is truncated

- **WHEN** the thumbnail workflow builds a prompt for a speech whose script content would exceed the Modal API prompt length limit
- **THEN** the prompt is truncated to at most 5000 characters before calling the Modal API

#### Scenario: Extra prompt included on regenerate run

- **WHEN** the thumbnail workflow runs with a non-empty extra prompt argument
- **THEN** the prompt sent to the Modal API includes that author direction in addition to the standard metadata-built prompt

#### Scenario: Extra prompt omitted on create run

- **WHEN** the thumbnail workflow runs from speech create without an extra prompt argument
- **THEN** the prompt sent to the Modal API matches the standard metadata-built prompt with no author direction segment

#### Scenario: Stale run does not overwrite generation

- **WHEN** a cancelled or superseded workflow run reaches the finalize step and the generation row's `workflowRunId` does not match the run id
- **THEN** the generation row and `Speech.thumbnailR2ObjectKey` are not updated by that run

### Requirement: Modal speech thumbnail deployment

The repository SHALL include `modal/speech_thumbnail.py` deploying a Modal app that runs SD 3.5 Medium Turbo on `a10g` with `max_containers` 1 and `@modal.concurrent(max_inputs=1)`. The app SHALL expose an authenticated `POST /generate` endpoint accepting a prompt and returning WebP image bytes at 832×1088 with `Content-Type: image/webp`. Deployment SHALL be performed via `.github/workflows/deploy-modal-thumbnail-image.yml` using existing `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET`. Modal secrets SHALL include `hf-token` and `thumbnail-api-key` synced by `.github/workflows/setup-modal-secrets.yml`.

#### Scenario: Deploy workflow targets thumbnail app

- **WHEN** the deploy thumbnail workflow is run manually
- **THEN** `modal deploy modal/speech_thumbnail.py` is executed

#### Scenario: Setup secrets includes thumbnail API key

- **WHEN** the setup Modal secrets workflow is run
- **THEN** a Modal secret `thumbnail-api-key` is created or updated from GitHub secret `THUMBNAIL_API_KEY`

#### Scenario: Generate returns WebP

- **WHEN** an authenticated client calls `POST /generate` with a valid prompt
- **THEN** the response has `Content-Type: image/webp` and non-empty WebP image bytes at 832×1088

### Requirement: Thumbnail workflow cancel on regenerate

When `speeches.regenerateThumbnail` is invoked, the system SHALL best-effort cancel the previous workflow run via `getRun(storedWorkflowRunId).cancel()` when a `SpeechThumbnailGeneration` row exists with `status` `processing` and a non-null `workflowRunId`, then start a new workflow and update the generation row with the new `workflowRunId` and `status` `processing`.

#### Scenario: Regenerate cancels in-flight workflow

- **WHEN** `regenerateThumbnail` is called while a thumbnail workflow is in progress
- **THEN** the previous run is cancelled (best-effort) and a new workflow is started with an updated `workflowRunId`

#### Scenario: Cancel failure does not block regenerate

- **WHEN** cancel throws because the previous run already completed or is not found
- **THEN** regenerate still starts a new workflow and updates the generation row

### Requirement: SpeechThumbnailGeneration persistence model

The system SHALL persist the latest thumbnail job state in PostgreSQL using a Prisma `SpeechThumbnailGeneration` model with fields: `id`, `speechId` (unique FK to `Speech`), `status` (enum: `processing`, `finished`, `failed`), optional `errorMessage`, optional `workflowRunId`, `createdAt`, and `updatedAt`. At most one row SHALL exist per speech.

#### Scenario: Generation row on create

- **WHEN** a speech is created and the thumbnail workflow is started
- **THEN** a `SpeechThumbnailGeneration` row exists with `status` `processing` and the started run's `workflowRunId`

#### Scenario: Generation row overwritten on regenerate

- **WHEN** `regenerateThumbnail` succeeds
- **THEN** the existing generation row is updated to `status` `processing` with a new `workflowRunId` and cleared `errorMessage`
