## MODIFIED Requirements

### Requirement: CMS speech create page

The CMS SHALL provide a page at `/cms/speeches/new` where the user selects a target language first, then selects a voice and script filtered to that language (voices without stored audio excluded), adjusts TTS sliders (Creativity, Voice Variety, Expression Range, Natural Flow, and norm loudness), generates a preview via `speeches.generatePreview`, may regenerate after changing voice, script, or slider values, and saves by uploading the preview WAV to storage via `speeches.getUploadUrl` then persisting via `speeches.create` with the returned `id` and `r2ObjectKey`. On successful save, the app SHALL redirect to `/cms/speeches/{speechId}`. The page SHALL NOT show creator/`createdBy` in v1.

#### Scenario: Language gates voice and script pickers

- **WHEN** user selects Vietnamese on the create page
- **THEN** voice and script pickers only offer items with language `vi-VN`

#### Scenario: Generate preview

- **WHEN** user selects a valid voice and script and clicks generate
- **THEN** a loading state is shown, preview audio plays in a waveform player on success, and no speech row is persisted yet

#### Scenario: Regenerate after slider change

- **WHEN** user changes a TTS slider and clicks generate again
- **THEN** a new preview is fetched and replaces the prior preview audio

#### Scenario: Save uploads then creates

- **WHEN** user saves after configuring voice, script, language, and TTS parameters with a current preview
- **THEN** the client obtains an upload URL, uploads the preview WAV, calls `speeches.create` with the storage key, and navigates to `/cms/speeches/{id}`

#### Scenario: Save shows loading during upload

- **WHEN** user clicks save and the upload or create request is in flight
- **THEN** the save control shows a loading state and is disabled to prevent duplicate submissions
