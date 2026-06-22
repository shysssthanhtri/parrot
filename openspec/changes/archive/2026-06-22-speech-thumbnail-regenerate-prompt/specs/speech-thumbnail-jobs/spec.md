## MODIFIED Requirements

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
