# cms-speeches Specification

## Purpose

TBD - created by archiving change speeches. Update Purpose after archive.

## Requirements

### Requirement: CMS speeches list page

The CMS SHALL provide a page at `/cms/speeches` that displays all speeches in a shadcn table with columns appropriate for browsing (at minimum: script title, voice name, language label, length, process status, updated date). The length column SHALL display the speech's stored `contentLength` formatted as a locale-aware integer with a "chars" suffix. The process status column SHALL display a readable label for `pending`, `processing`, `finished`, and `failed`. The page SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: View speeches table

- **WHEN** an authenticated CMS user navigates to `/cms/speeches`
- **THEN** a table of all speeches is shown including readable language labels, content length, and process status for each row

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

### Requirement: TTS slider tooltips on create page

Each TTS control on the speech create page (Creativity, Voice Variety, Expression Range, Natural Flow, and norm loudness) SHALL display a tooltip explaining what the setting affects. Tooltip copy SHALL be defined alongside slider config in `src/lib/speech-sliders.ts` (and norm loudness config) and rendered via the shared shadcn tooltip component.

#### Scenario: View slider tooltip

- **WHEN** user focuses or hovers the info affordance next to a TTS slider label on `/cms/speeches/new`
- **THEN** a tooltip appears with a plain-language explanation of that setting

#### Scenario: Tooltip copy comes from shared config

- **WHEN** the create form renders TTS controls
- **THEN** each slider's tooltip text is read from `speech-sliders.ts` rather than hard-coded in the component

### Requirement: CMS speech detail page

The CMS SHALL provide a page at `/cms/speeches/[speechId]` showing speech metadata (linked script title, voice name, language, TTS parameter values, timestamps, and process status), the full script text with synchronized chunk highlighting when alignment is stored and audio is playable (past chunks dimmed, active chunk highlighted, upcoming chunks normal, driven by audio playback time), and a waveform-based audio preview when `processStatus` is `finished` and audio is available. While `processStatus` is `pending` or `processing`, the page SHALL show a generating state with chunk-based progress (percentage and chunk fraction when `totalChunks` is greater than zero) derived from `settledChunks` and `totalChunks`, and poll `speeches.getById` until the status becomes `finished` or `failed`. When `processStatus` is `failed`, the page SHALL display `errorMessage` and a retry control that calls `speeches.retry` and resumes polling. When alignment is not stored (legacy speeches), the page SHALL display the script content without synchronized highlighting. The page SHALL provide a **Delete speech** control with a confirmation dialog that calls `speeches.delete` and, on success, navigates to `/cms/speeches` with a success toast. The delete control SHALL be available regardless of `processStatus`.

#### Scenario: View speech metadata

- **WHEN** an authenticated CMS user opens `/cms/speeches/{id}` for an existing speech
- **THEN** script title, voice name, language, TTS settings, process status, and timestamps are displayed

#### Scenario: Generating state polls until finished

- **WHEN** an authenticated CMS user opens a speech detail page with `processStatus` `processing`
- **THEN** a generating indicator with chunk-based progress is shown, audio playback is unavailable, and the client refreshes speech data until status becomes `finished` or `failed`

#### Scenario: Generating state shows percentage during synthesis

- **WHEN** an authenticated CMS user views a speech with `processStatus` `processing`, `totalChunks` 12, and `settledChunks` 3
- **THEN** the generating UI shows progress equivalent to 3 of 12 chunks (25%) rather than a generic generating message only

#### Scenario: Generating state before chunks are known

- **WHEN** an authenticated CMS user views a speech with `processStatus` `pending` or `processing` and `totalChunks` 0
- **THEN** the generating UI shows a starting state without a chunk fraction

#### Scenario: Generating state during finalize

- **WHEN** an authenticated CMS user views a speech with `processStatus` `processing`, `totalChunks` greater than zero, and `settledChunks` equal to `totalChunks`
- **THEN** the generating UI indicates finalization is in progress (e.g. 100% with a finalizing label)

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

#### Scenario: Delete speech with confirmation

- **WHEN** user clicks **Delete speech** on the detail page and confirms the dialog
- **THEN** `speeches.delete` is called, a success toast is shown, and the app navigates to `/cms/speeches`

#### Scenario: Cancel delete

- **WHEN** user opens the delete confirmation dialog and clicks cancel
- **THEN** no delete request is sent and the user remains on the detail page

#### Scenario: Delete while generating

- **WHEN** user deletes a speech with `processStatus` `pending` or `processing`
- **THEN** the delete succeeds and the user is redirected to the speeches list

### Requirement: Loading UI on speeches list page

While the speeches list page is loading, the CMS SHALL display a loading UI at `/cms/speeches` that matches the list page layout: page heading area and a table skeleton with columns for script title, voice name, language, length, process status, and updated date.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated CMS user navigates to `/cms/speeches` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with a table-shaped placeholder matching the speeches list columns

### Requirement: Speech detail audio preview survives tab refocus

When a finished speech is playing or paused on the detail page, returning to the browser tab after a metadata refetch SHALL NOT cause the waveform player to reload or re-download the audio file if the underlying stored audio object is unchanged. Playback position and loaded waveform state SHALL be preserved across tab switches under normal use.

#### Scenario: Tab refocus does not reload finished speech audio

- **WHEN** an authenticated CMS user is previewing audio on a finished speech detail page, switches to another browser tab, and returns while React Query refetches speech metadata
- **THEN** the waveform player keeps its loaded audio and current playback position without showing the loading state again or issuing a new full audio download for the same speech object

#### Scenario: New audio after generation still loads

- **WHEN** a speech transitions from `processing` to `finished` while the user remains on the detail page (via polling)
- **THEN** the audio preview loads the newly available audio once and begins playback from the start

#### Scenario: Retry after failure loads fresh audio

- **WHEN** a user retries a failed speech and generation completes successfully
- **THEN** the audio preview loads the new audio file (replacing any prior preview state)
