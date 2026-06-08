## MODIFIED Requirements

### Requirement: CMS speeches list page

The CMS SHALL provide a page at `/cms/speeches` that displays all speeches in a shadcn table with columns appropriate for browsing (at minimum: script title, voice name, language label, length, updated date). The length column SHALL display the speech's stored `contentLength` formatted as a locale-aware integer with a "chars" suffix. The page SHALL be behind existing CMS authentication.

#### Scenario: View speeches table

- **WHEN** an authenticated user navigates to `/cms/speeches`
- **THEN** a table of all speeches is shown including readable language labels and content length for each row

### Requirement: CMS speech create page

The CMS SHALL provide a page at `/cms/speeches/new` where the user selects a target language first, then selects a voice and script filtered to that language (voices without stored audio excluded), adjusts TTS sliders (Creativity, Voice Variety, Expression Range, Natural Flow, and norm loudness), generates a preview via `speeches.generatePreview`, may regenerate after changing voice, script, or slider values, and saves by uploading the preview WAV to storage via `speeches.getUploadUrl` then persisting via `speeches.create` with the returned `id` and `r2ObjectKey`. Each script option in the script picker SHALL display the script title and its `contentLength` (e.g. `Morning routine (842 chars)`). On successful save, the app SHALL redirect to `/cms/speeches/{speechId}`. The page SHALL NOT show creator/`createdBy` in v1.

#### Scenario: Language gates voice and script pickers

- **WHEN** user selects Vietnamese on the create page
- **THEN** voice and script pickers only offer items with language `vi-VN`

#### Scenario: Script picker shows length

- **WHEN** user opens the script select on `/cms/speeches/new`
- **THEN** each script option shows the title and formatted content length

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

### Requirement: Loading UI on speeches list page

While the speeches list page is loading, the CMS SHALL display a loading UI at `/cms/speeches` that matches the list page layout: page heading area and a table skeleton with columns for script title, voice name, language, length, and updated date.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated user navigates to `/cms/speeches` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with a table-shaped placeholder matching the speeches list columns

#### Scenario: Loading resolves to list

- **WHEN** speech data finishes loading on `/cms/speeches`
- **THEN** the loading UI is replaced by the speeches table (or empty state)
