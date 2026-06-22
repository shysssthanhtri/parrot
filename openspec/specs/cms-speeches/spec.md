# cms-speeches Specification

## Purpose

TBD - created by archiving change speeches. Update Purpose after archive.

## Requirements

### Requirement: CMS speeches list page

The CMS SHALL provide a page at `/cms/speeches` that displays all speeches in a shadcn table with columns appropriate for browsing (at minimum: script title, voice name, language label, length, TTS generation status, publication status, updated date). The length column SHALL display the speech's stored `contentLength` formatted as a locale-aware integer with a "chars" suffix. The TTS status column SHALL display a readable label for `processing`, `finished`, and `failed` from linked `ttsGeneration.status` and SHALL use a column header that distinguishes it from publication status (e.g. **Audio** or **Process**). The publication status column SHALL display `Not published`, `Published`, or `Unpublished` using the same labels and badge variants as the speech detail page. The page SHALL use the shared CMS page header with **Speeches** as the current breadcrumb segment instead of an in-page `h1` title. The page SHALL provide a **New speech** control below the header. The page SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: View speeches table

- **WHEN** an authenticated CMS user navigates to `/cms/speeches`
- **THEN** a table of all speeches is shown below the page header breadcrumb **Speeches**, including readable language labels, content length, TTS generation status, and publication status for each row

#### Scenario: Published speech shows live status in list

- **WHEN** an authenticated CMS user views the speeches list and a speech has publication `status` `published`
- **THEN** that row's publication column shows **Published**

#### Scenario: Unpublished speech shows hidden status in list

- **WHEN** an authenticated CMS user views the speeches list and a speech has publication `status` `unpublished`
- **THEN** that row's publication column shows **Unpublished**

#### Scenario: Draft speech shows not published in list

- **WHEN** an authenticated CMS user views the speeches list and a speech has no publication row
- **THEN** that row's publication column shows **Not published**

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

### Requirement: TTS slider tooltips on create page

Each TTS control on the speech create page (Creativity, Voice Variety, Expression Range, Natural Flow, and norm loudness) SHALL display a tooltip explaining what the setting affects. Tooltip copy SHALL be defined alongside slider config in `src/lib/speech-sliders.ts` (and norm loudness config) and rendered via the shared shadcn tooltip component.

#### Scenario: View slider tooltip

- **WHEN** user focuses or hovers the info affordance next to a TTS slider label on `/cms/speeches/new`
- **THEN** a tooltip appears with a plain-language explanation of that setting

#### Scenario: Tooltip copy comes from shared config

- **WHEN** the create form renders TTS controls
- **THEN** each slider's tooltip text is read from `speech-sliders.ts` rather than hard-coded in the component

### Requirement: CMS speech detail page

The CMS SHALL provide a page at `/cms/speeches/[speechId]` showing speech metadata (linked script title, voice name, language, TTS parameter values, timestamps, TTS generation status, and publication status), a **Publishing** card per `cms-speech-publishing` requirements, a **Thumbnail** card per thumbnail requirements, the full script text with synchronized chunk highlighting when alignment is stored and audio is playable (past chunks dimmed, active chunk highlighted, upcoming chunks normal, driven by audio playback time), and a waveform-based audio preview when `ttsGeneration.status` is `finished` and audio is available. The page SHALL use the shared CMS page header with breadcrumbs **Speeches** (link to `/cms/speeches`) and the linked script title as the current segment instead of an in-page back link. While `ttsGeneration.status` is `processing`, the page SHALL show a generating state with a spinner and a generic generating label (no chunk fraction or percentage), and poll `speeches.getById` until the status becomes `finished` or `failed`. When `ttsGeneration.status` is `processing` and the speech is eligible for regenerate per `speeches.regenerate` rules (`processingStartedAt` null or at least 30 minutes ago), the generating card SHALL include a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When `ttsGeneration.status` is `failed`, the page SHALL display `ttsGeneration.errorMessage` and a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When `ttsGeneration.status` is `finished`, publication `status` is not `published`, and audio is playable, the audio preview section SHALL include a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When publication `status` is `published`, the audio preview section SHALL NOT show the standard **Regenerate** control. When the waveform player reports a load error, the audio preview section SHALL still offer **Regenerate** as a recovery action when publication `status` is not `published` (in addition to any existing open-in-new-tab link). When alignment is not stored (legacy speeches), the page SHALL display the script content without synchronized highlighting. The page SHALL provide a **Delete speech** control with a confirmation dialog that calls `speeches.delete` and, on success, navigates to `/cms/speeches` with a success toast. The delete control SHALL be blocked when publication `status` is `published` and SHALL remain available otherwise regardless of TTS generation status.

#### Scenario: View speech metadata

- **WHEN** an authenticated CMS user opens `/cms/speeches/{id}` for an existing speech
- **THEN** script title, voice name, language, TTS settings, TTS generation status, publication status, and timestamps are displayed below the page header breadcrumbs **Speeches** → script title

#### Scenario: Generating state polls until finished

- **WHEN** an authenticated CMS user opens a speech detail page with `ttsGeneration.status` `processing`
- **THEN** a generating indicator with a spinner is shown, audio playback is unavailable, and the client refreshes speech data until status becomes `finished` or `failed`

#### Scenario: Failed speech shows regenerate

- **WHEN** an authenticated CMS user opens a speech with `ttsGeneration.status` `failed`
- **THEN** the error message is shown and a regenerate control is available when not published

#### Scenario: Regenerate on failed resumes polling

- **WHEN** user clicks regenerate on a failed speech detail page
- **THEN** `speeches.regenerate` is invoked and the page polls until processing completes or fails again

#### Scenario: Finished speech shows regenerate in audio preview

- **WHEN** an authenticated CMS user opens a finished speech with playable audio and publication `status` is not `published`
- **THEN** the audio preview card includes a regenerate control alongside the waveform player

#### Scenario: Regenerate starts new generation

- **WHEN** user clicks regenerate on a finished speech detail page
- **THEN** `speeches.regenerate` is invoked, a success toast is shown, and the page shows the generating state and polls until processing completes or fails

#### Scenario: Stuck generating state shows regenerate

- **WHEN** an authenticated CMS user views a speech with `ttsGeneration.status` `processing` and `processingStartedAt` at least 30 minutes ago
- **THEN** the generating card includes a regenerate control when not published

#### Scenario: Recent processing hides regenerate

- **WHEN** an authenticated CMS user views a speech with `ttsGeneration.status` `processing` and `processingStartedAt` less than 30 minutes ago
- **THEN** the generating card does not offer regenerate

#### Scenario: Regenerate disabled while request in flight

- **WHEN** user clicks regenerate and the regenerate mutation is pending
- **THEN** the regenerate control shows a loading/disabled state to prevent duplicate submissions

#### Scenario: Regenerate offered on waveform load error

- **WHEN** the waveform player fails to load the audio URL on a finished speech that is not published
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

- **WHEN** user deletes a speech with `ttsGeneration.status` `processing` and publication `status` is not `published`
- **THEN** the delete succeeds and the user is redirected to the speeches list

#### Scenario: Delete blocked while published

- **WHEN** user attempts to delete a speech with publication `status` `published`
- **THEN** delete is not available until the speech is unpublished

### Requirement: Loading UI on speeches list page

While the speeches list page is loading, the CMS SHALL display a loading UI at `/cms/speeches` that matches the list page layout: shared page header with **Speeches** breadcrumb and a table skeleton with columns for script title, voice name, language, length, process status, publication status, and updated date.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated CMS user navigates to `/cms/speeches` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with the shared page header breadcrumb **Speeches** and a table-shaped placeholder matching the speeches list columns including publication status

### Requirement: Speech detail audio preview survives tab refocus

When a finished speech is playing or paused on the detail page, returning to the browser tab after a metadata refetch SHALL NOT cause the waveform player to reload or re-download the audio file if the underlying stored audio object is unchanged. Playback position and loaded waveform state SHALL be preserved across tab switches under normal use.

#### Scenario: Tab refocus does not reload finished speech audio

- **WHEN** an authenticated CMS user is previewing audio on a finished speech detail page, switches to another browser tab, and returns while React Query refetches speech metadata
- **THEN** the waveform player keeps its loaded audio and current playback position without showing the loading state again or issuing a new full audio download for the same speech object

#### Scenario: New audio after generation still loads

- **WHEN** a speech transitions from `processing` to `finished` while the user remains on the detail page (via polling)
- **THEN** the audio preview loads the newly available audio once and begins playback from the start

#### Scenario: Regenerate after failure loads fresh audio

- **WHEN** a user regenerates a failed speech and generation completes successfully
- **THEN** the audio preview loads the new audio file (replacing any prior preview state)

#### Scenario: Regenerate loads fresh audio

- **WHEN** a user regenerates a finished speech and generation completes successfully
- **THEN** the audio preview loads the new audio file (replacing any prior waveform and playback state)

### Requirement: CMS speech thumbnail section

The CMS speech detail page SHALL include a **Thumbnail** card showing `thumbnailProcessStatus`, an image preview when `thumbnailProcessStatus` is `finished` and a thumbnail URL is available, and `thumbnailErrorMessage` when `failed`. While `thumbnailProcessStatus` is `pending` or `processing`, the card SHALL show a generating state and poll `speeches.getById` until status becomes `finished` or `failed`. When publication `status` is not `published`, the card SHALL offer **Regenerate thumbnail** opening a confirmation dialog. The dialog SHALL include an optional **Extra prompt** field (textarea) for author direction on the new cover image. Confirming **Regenerate thumbnail** SHALL call `speeches.regenerateThumbnail` with the speech `id` and the trimmed extra prompt when non-empty, with loading/disabled state while in flight. When publication `status` is `published`, **Regenerate thumbnail** SHALL NOT be shown.

#### Scenario: Thumbnail preview when finished

- **WHEN** an authenticated CMS user views a speech with `thumbnailProcessStatus` `finished`
- **THEN** the Thumbnail card displays the cover image preview

#### Scenario: Thumbnail generating state polls

- **WHEN** an authenticated CMS user views a speech with `thumbnailProcessStatus` `processing`
- **THEN** a generating indicator is shown and the client refreshes until status becomes `finished` or `failed`

#### Scenario: Manual regenerate thumbnail

- **WHEN** user confirms **Regenerate thumbnail** on an unpublished speech without entering an extra prompt
- **THEN** `speeches.regenerateThumbnail` is invoked with the speech `id` only and the card returns to a generating state

#### Scenario: Manual regenerate thumbnail with extra prompt

- **WHEN** user enters text in **Extra prompt** and confirms **Regenerate thumbnail** on an unpublished speech
- **THEN** `speeches.regenerateThumbnail` is invoked with the speech `id` and trimmed extra prompt and the card returns to a generating state

#### Scenario: Thumbnail regenerate hidden while published

- **WHEN** user views a speech with publication `status` `published`
- **THEN** the Thumbnail card does not offer **Regenerate thumbnail**
