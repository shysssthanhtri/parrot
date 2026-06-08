# cms-speeches Specification

## Purpose

TBD - created by archiving change speeches. Update Purpose after archive.

## Requirements

### Requirement: CMS speeches list page

The CMS SHALL provide a page at `/cms/speeches` that displays all speeches in a shadcn table with columns appropriate for browsing (at minimum: script title, voice name, language label, updated date). The page SHALL be behind existing CMS authentication.

#### Scenario: View speeches table

- **WHEN** an authenticated user navigates to `/cms/speeches`
- **THEN** a table of all speeches is shown including readable language labels

### Requirement: New speech entry from list

The CMS speeches list page SHALL provide a control (e.g. **New speech** button) that navigates to `/cms/speeches/new`.

#### Scenario: Open create page

- **WHEN** user clicks the new-speech control on the list page
- **THEN** the app navigates to `/cms/speeches/new`

### Requirement: Navigate to speech detail from list

The CMS SHALL render the script title in the speeches list table as a link to `/cms/speeches/{speechId}`. The link SHALL use Next.js `Link` (rendering a real anchor) and match the primary-column link pattern used on the scripts and voices list tables.

#### Scenario: Script title link opens detail

- **WHEN** user activates the script title link for a speech in the list table
- **THEN** the app navigates to the detail page for that speech's id

#### Scenario: Script title is a real anchor

- **WHEN** the speeches list table is rendered
- **THEN** each script title is an `<a>` element with `href` set to `/cms/speeches/{speechId}`

#### Scenario: Open detail in new tab

- **WHEN** user opens the script title link with a new-tab gesture (e.g. modifier-click or context menu)
- **THEN** the speech detail page opens in a new browser tab

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

### Requirement: TTS slider tooltips on create page

Each TTS control on the speech create page (Creativity, Voice Variety, Expression Range, Natural Flow, and norm loudness) SHALL display a tooltip explaining what the setting affects. Tooltip copy SHALL be defined alongside slider config in `src/lib/speech-sliders.ts` (and norm loudness config) and rendered via the shared shadcn tooltip component.

#### Scenario: View slider tooltip

- **WHEN** user focuses or hovers the info affordance next to a TTS slider label on `/cms/speeches/new`
- **THEN** a tooltip appears with a plain-language explanation of that setting

#### Scenario: Tooltip copy comes from shared config

- **WHEN** the create form renders TTS controls
- **THEN** each slider's tooltip text is read from `speech-sliders.ts` rather than hard-coded in the component

### Requirement: CMS speech detail page

The CMS SHALL provide a read-only page at `/cms/speeches/[speechId]` showing speech metadata (linked script title, voice name, language, TTS parameter values, timestamps) and a waveform-based audio preview when audio is available. The page SHALL NOT offer edit, archive, or delete controls in v1.

#### Scenario: View speech metadata

- **WHEN** an authenticated user opens `/cms/speeches/{id}` for an existing speech
- **THEN** script title, voice name, language, TTS settings, and timestamps are displayed

#### Scenario: Preview saved speech

- **WHEN** user views detail for a speech with stored audio
- **THEN** a waveform player loads and plays the speech via the resolved storage URL

#### Scenario: Speech not found

- **WHEN** user opens `/cms/speeches/{id}` for a non-existent speech
- **THEN** a not-found UI is shown

### Requirement: Loading UI on speeches list page

While the speeches list page is loading, the CMS SHALL display a loading UI at `/cms/speeches` that matches the list page layout: page heading area and a table skeleton with columns for script title, voice name, language, and updated date.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated user navigates to `/cms/speeches` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with a table-shaped placeholder matching the speeches list columns

#### Scenario: Loading resolves to list

- **WHEN** speech data finishes loading on `/cms/speeches`
- **THEN** the loading UI is replaced by the speeches table (or empty state)
