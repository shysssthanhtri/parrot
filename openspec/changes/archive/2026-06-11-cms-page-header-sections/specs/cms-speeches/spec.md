# cms-speeches Specification

## MODIFIED Requirements

### Requirement: CMS speeches list page

The CMS SHALL provide a page at `/cms/speeches` that displays all speeches in a shadcn table with columns appropriate for browsing (at minimum: script title, voice name, language label, length, process status, updated date). The length column SHALL display the speech's stored `contentLength` formatted as a locale-aware integer with a "chars" suffix. The process status column SHALL display a readable label for `pending`, `processing`, `finished`, and `failed`. The page SHALL use the shared CMS page header with **Speeches** as the current breadcrumb segment instead of an in-page `h1` title. The page SHALL provide a **New speech** control below the header. The page SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: View speeches table

- **WHEN** an authenticated CMS user navigates to `/cms/speeches`
- **THEN** a table of all speeches is shown below the page header breadcrumb **Speeches**, including readable language labels, content length, and process status for each row

### Requirement: CMS speech create page

The CMS SHALL provide a page at `/cms/speeches/new` where the user selects a target language first, then selects a voice and script filtered to that language (voices without stored audio excluded), adjusts TTS sliders (Creativity, Voice Variety, Expression Range, Natural Flow, and norm loudness), and creates a speech via `speeches.create` without generating a synchronous preview or uploading audio from the browser. The page SHALL use the shared CMS page header with breadcrumbs **Speeches** (link to `/cms/speeches`) and **New** as the current segment instead of an in-page back link. Each script option in the script picker SHALL display the script title and its `contentLength` (e.g. `Morning routine (842 chars)`). On successful create, the app SHALL redirect to `/cms/speeches/{speechId}`. The page SHALL NOT show creator/`createdBy` in v1.

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

The CMS SHALL provide a page at `/cms/speeches/[speechId]` showing speech metadata (linked script title, voice name, language, TTS parameter values, timestamps, and process status), the full script text with synchronized chunk highlighting when alignment is stored and audio is playable (past chunks dimmed, active chunk highlighted, upcoming chunks normal, driven by audio playback time), and a waveform-based audio preview when `processStatus` is `finished` and audio is available. The page SHALL use the shared CMS page header with breadcrumbs **Speeches** (link to `/cms/speeches`) and the linked script title as the current segment instead of an in-page back link. While `processStatus` is `pending` or `processing`, the page SHALL show a generating state with chunk-based progress (percentage and chunk fraction when `totalChunks` is greater than zero) derived from `settledChunks` and `totalChunks`, and poll `speeches.getById` until the status becomes `finished` or `failed`. When `processStatus` is `pending` or `processing` and the speech is eligible for regenerate per `speeches.regenerate` rules (`processingStartedAt` null or at least 30 minutes ago for `processing`; always for `pending`), the generating card SHALL include a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When `processStatus` is `failed`, the page SHALL display `errorMessage` and a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When `processStatus` is `finished` and audio is playable, the audio preview section SHALL include a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When the waveform player reports a load error, the audio preview section SHALL still offer **Regenerate** as a recovery action (in addition to any existing open-in-new-tab link). When alignment is not stored (legacy speeches), the page SHALL display the script content without synchronized highlighting. The page SHALL provide a **Delete speech** control with a confirmation dialog that calls `speeches.delete` and, on success, navigates to `/cms/speeches` with a success toast. The delete control SHALL be available regardless of `processStatus`.

#### Scenario: View speech metadata

- **WHEN** an authenticated CMS user opens `/cms/speeches/{id}` for an existing speech
- **THEN** script title, voice name, language, TTS settings, process status, and timestamps are displayed below the page header breadcrumbs **Speeches** → script title

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

#### Scenario: Failed speech shows regenerate

- **WHEN** an authenticated CMS user opens a speech with `processStatus` `failed`
- **THEN** the error message is shown and a regenerate control is available

#### Scenario: Regenerate on failed resumes polling

- **WHEN** user clicks regenerate on a failed speech detail page
- **THEN** `speeches.regenerate` is invoked and the page polls until processing completes or fails again

#### Scenario: Finished speech shows regenerate in audio preview

- **WHEN** an authenticated CMS user opens a finished speech with playable audio
- **THEN** the audio preview card includes a regenerate control alongside the waveform player

#### Scenario: Regenerate starts new generation

- **WHEN** user clicks regenerate on a finished speech detail page
- **THEN** `speeches.regenerate` is invoked, a success toast is shown, and the page shows the generating state and polls until processing completes or fails

#### Scenario: Stuck generating state shows regenerate

- **WHEN** an authenticated CMS user views a speech with `processStatus` `processing` and `processingStartedAt` at least 30 minutes ago
- **THEN** the generating card includes a regenerate control

#### Scenario: Recent processing hides regenerate

- **WHEN** an authenticated CMS user views a speech with `processStatus` `processing` and `processingStartedAt` less than 30 minutes ago
- **THEN** the generating card does not offer regenerate

#### Scenario: Pending speech shows regenerate

- **WHEN** an authenticated CMS user views a speech with `processStatus` `pending`
- **THEN** the generating card includes a regenerate control

#### Scenario: Regenerate disabled while request in flight

- **WHEN** user clicks regenerate and the regenerate mutation is pending
- **THEN** the regenerate control shows a loading/disabled state to prevent duplicate submissions

#### Scenario: Regenerate offered on waveform load error

- **WHEN** the waveform player fails to load the audio URL on a finished speech
- **THEN** the audio preview section shows the error, retains open-in-new-tab recovery if available, and offers regenerate

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

While the speeches list page is loading, the CMS SHALL display a loading UI at `/cms/speeches` that matches the list page layout: shared page header with **Speeches** breadcrumb and a table skeleton with columns for script title, voice name, language, length, process status, and updated date.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated CMS user navigates to `/cms/speeches` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with the shared page header breadcrumb **Speeches** and a table-shaped placeholder matching the speeches list columns
