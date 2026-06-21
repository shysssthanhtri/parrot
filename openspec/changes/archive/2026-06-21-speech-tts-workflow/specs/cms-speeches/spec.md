## MODIFIED Requirements

### Requirement: CMS speeches list page

The CMS SHALL provide a page at `/cms/speeches` that displays all speeches in a shadcn table with columns appropriate for browsing (at minimum: script title, voice name, language label, length, TTS generation status, publication status, updated date). The length column SHALL display the speech's stored `contentLength` formatted as a locale-aware integer with a "chars" suffix. The TTS status column SHALL display a readable label for `processing`, `finished`, and `failed` from linked `ttsGeneration.status` and SHALL use a column header that distinguishes it from publication status (e.g. **Audio** or **Process**). The publication status column SHALL display `Not published`, `Published`, or `Unpublished` using the same labels and badge variants as the speech detail page. The page SHALL use the shared CMS page header with **Speeches** as the current breadcrumb segment instead of an in-page `h1` title. The page SHALL provide a **New speech** control below the header. The page SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: View speeches table

- **WHEN** an authenticated CMS user navigates to `/cms/speeches`
- **THEN** a table of all speeches is shown below the page header breadcrumb **Speeches**, including readable language labels, content length, TTS generation status, and publication status for each row

#### Scenario: Published speech shows live status in list

- **WHEN** an authenticated CMS user views the speeches list and a speech has publication `status` `published`
- **THEN** the publication status column shows **Published**

#### Scenario: Unpublished speech shows hidden status in list

- **WHEN** an authenticated CMS user views the speeches list and a speech has publication `status` `unpublished`
- **THEN** the publication status column shows **Unpublished**

#### Scenario: Draft speech shows not published in list

- **WHEN** an authenticated CMS user views the speeches list and a speech has no publication row
- **THEN** the publication status column shows **Not published**

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

- **WHEN** user deletes a speech with `ttsGeneration.status` `processing` and publication `status` is not `published`
- **THEN** the delete succeeds and the user is redirected to the speeches list

## REMOVED Requirements

### Requirement: CMS speech detail page chunk progress scenarios

**Reason**: TTS in-flight UX is spinner-only; chunk counters and percentage progress are removed with `SpeechChunk` and `totalChunks` / `settledChunks`.

**Migration**: Remove chunk-based progress UI and `getSpeechGenerationProgress` usage from `speech-detail.tsx`.
