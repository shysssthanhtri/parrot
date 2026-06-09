## MODIFIED Requirements

### Requirement: CMS speech create page

The CMS SHALL provide a page at `/cms/speeches/new` where the user selects a target language first, then selects a voice and script filtered to that language (voices without stored audio excluded), adjusts TTS sliders (Creativity, Voice Variety, Expression Range, Natural Flow, and norm loudness), generates a preview via `speeches.generatePreview`, may regenerate after changing voice, script, or slider values, and saves by uploading the preview WAV to storage via `speeches.getUploadUrl` then persisting via `speeches.create` with the returned `id`, `r2ObjectKey`, and preview `alignment`. Each script option in the script picker SHALL display the script title and its `contentLength` (e.g. `Morning routine (842 chars)`). When a preview is available, the page SHALL display a synchronized script viewer alongside the waveform player showing script text with past chunks dimmed, the active chunk highlighted, and upcoming chunks at normal emphasis, driven by preview playback time. On successful save, the app SHALL redirect to `/cms/speeches/{speechId}`. The page SHALL NOT show creator/`createdBy` in v1.

#### Scenario: Language gates voice and script pickers

- **WHEN** user selects Vietnamese on the create page
- **THEN** voice and script pickers only offer items with language `vi-VN`

#### Scenario: Script picker shows length

- **WHEN** user opens the script select on `/cms/speeches/new`
- **THEN** each script option shows the title and formatted content length

#### Scenario: Generate preview

- **WHEN** user selects a valid voice and script and clicks generate
- **THEN** a loading state is shown, preview audio plays in a waveform player on success, a synchronized script viewer reflects playback progress by chunk, and no speech row is persisted yet

#### Scenario: Regenerate after slider change

- **WHEN** user changes a TTS slider and clicks generate again
- **THEN** a new preview is fetched with updated alignment and replaces the prior preview audio and synchronized script view

#### Scenario: Save uploads then creates

- **WHEN** user saves after configuring voice, script, language, and TTS parameters with a current preview
- **THEN** the client obtains an upload URL, uploads the preview WAV, calls `speeches.create` with the storage key and preview alignment, and navigates to `/cms/speeches/{id}`

#### Scenario: Save shows loading during upload

- **WHEN** user clicks save and the upload or create request is in flight
- **THEN** the save control shows a loading state and is disabled to prevent duplicate submissions

### Requirement: CMS speech detail page

The CMS SHALL provide a read-only page at `/cms/speeches/[speechId]` showing speech metadata (linked script title, voice name, language, TTS parameter values, timestamps), the full script text with synchronized chunk highlighting when alignment is stored (past chunks dimmed, active chunk highlighted, upcoming chunks normal, driven by audio playback time), and a waveform-based audio preview when audio is available. When alignment is not stored (legacy speeches), the page SHALL display the script content without synchronized highlighting. The page SHALL NOT offer edit, archive, or delete controls in v1.

#### Scenario: View speech metadata

- **WHEN** an authenticated CMS user opens `/cms/speeches/{id}` for an existing speech
- **THEN** script title, voice name, language, TTS settings, and timestamps are displayed

#### Scenario: Synchronized script during playback

- **WHEN** an authenticated CMS user plays audio on a speech detail page that has stored alignment
- **THEN** the script viewer highlights the active chunk in sync with playback and dims past chunks

#### Scenario: Legacy speech without alignment

- **WHEN** an authenticated CMS user opens a speech saved before alignment was introduced
- **THEN** script content is shown without synchronized chunk highlighting and audio preview still works
