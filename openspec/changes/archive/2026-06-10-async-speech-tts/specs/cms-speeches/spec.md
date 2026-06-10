## MODIFIED Requirements

### Requirement: CMS speeches list page

The CMS SHALL provide a page at `/cms/speeches` that displays all speeches in a shadcn table with columns appropriate for browsing (at minimum: script title, voice name, language label, length, process status, updated date). The length column SHALL display the speech's stored `contentLength` formatted as a locale-aware integer with a "chars" suffix. The process status column SHALL display a readable label for `pending`, `processing`, `finished`, and `failed`. The page SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: View speeches table

- **WHEN** an authenticated CMS user navigates to `/cms/speeches`
- **THEN** a table of all speeches is shown including readable language labels, content length, and process status for each row

### Requirement: CMS speech create page

The CMS SHALL provide a page at `/cms/speeches/new` where the user selects a target language first, then selects a voice and script filtered to that language (voices without stored audio excluded), adjusts TTS sliders (Creativity, Voice Variety, Expression Range, Natural Flow, and norm loudness), and creates a speech via `speeches.create` without generating a synchronous preview or uploading audio from the browser. Each script option in the script picker SHALL display the script title and its `contentLength` (e.g. `Morning routine (842 chars)`). On successful create, the app SHALL redirect to `/cms/speeches/{speechId}`. The page SHALL NOT show creator/`createdBy` in v1.

#### Scenario: Language gates voice and script pickers

- **WHEN** user selects Vietnamese on the create page
- **THEN** voice and script pickers only offer items with language `vi-VN`

#### Scenario: Script picker shows length

- **WHEN** user opens the script select on `/cms/speeches/new`
- **THEN** each script option shows the title and formatted content length

#### Scenario: Create enqueues async processing

- **WHEN** user selects a valid voice and script and clicks create
- **THEN** a loading state is shown, `speeches.create` is called, and the app navigates to the speech detail page without waiting for audio generation to finish

#### Scenario: Create shows loading during request

- **WHEN** user clicks create and the create request is in flight
- **THEN** the create control shows a loading state and is disabled to prevent duplicate submissions

### Requirement: CMS speech detail page

The CMS SHALL provide a read-only page at `/cms/speeches/[speechId]` showing speech metadata (linked script title, voice name, language, TTS parameter values, timestamps, and process status), the full script text with synchronized chunk highlighting when alignment is stored and audio is playable (past chunks dimmed, active chunk highlighted, upcoming chunks normal, driven by audio playback time), and a waveform-based audio preview when `processStatus` is `finished` and audio is available. While `processStatus` is `pending` or `processing`, the page SHALL show a generating state and poll `speeches.getById` until the status becomes `finished` or `failed`. When `processStatus` is `failed`, the page SHALL display `errorMessage` and a retry control that calls `speeches.retry` and resumes polling. When alignment is not stored (legacy speeches), the page SHALL display the script content without synchronized highlighting. The page SHALL NOT offer edit, archive, or delete controls in v1.

#### Scenario: View speech metadata

- **WHEN** an authenticated CMS user opens `/cms/speeches/{id}` for an existing speech
- **THEN** script title, voice name, language, TTS settings, process status, and timestamps are displayed

#### Scenario: Generating state polls until finished

- **WHEN** an authenticated CMS user opens a speech detail page with `processStatus` `processing`
- **THEN** a generating indicator is shown, audio playback is unavailable, and the client refreshes speech data until status becomes `finished` or `failed`

#### Scenario: Failed speech shows retry

- **WHEN** an authenticated CMS user opens a speech with `processStatus` `failed`
- **THEN** the error message is shown and a retry control is available

#### Scenario: Retry resumes polling

- **WHEN** user clicks retry on a failed speech detail page
- **THEN** `speeches.retry` is invoked and the page polls until processing completes or fails again

#### Scenario: Synchronized script during playback

- **WHEN** an authenticated CMS user plays audio on a finished speech detail page that has stored alignment
- **THEN** the script viewer highlights the active chunk in sync with playback and dims past chunks

#### Scenario: Legacy speech without alignment

- **WHEN** an authenticated CMS user opens a speech saved before alignment was introduced
- **THEN** script content is shown without synchronized chunk highlighting and audio preview still works when finished

### Requirement: Loading UI on speeches list page

While the speeches list page is loading, the CMS SHALL display a loading UI at `/cms/speeches` that matches the list page layout: page heading area and a table skeleton with columns for script title, voice name, language, length, process status, and updated date.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated CMS user navigates to `/cms/speeches` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with a table-shaped placeholder matching the speeches list columns
