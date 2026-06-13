## ADDED Requirements

### Requirement: CMS speech thumbnail section

The CMS speech detail page SHALL include a **Thumbnail** card showing `thumbnailProcessStatus`, an image preview when `thumbnailProcessStatus` is `finished` and a thumbnail URL is available, and `thumbnailErrorMessage` when `failed`. While `thumbnailProcessStatus` is `pending` or `processing`, the card SHALL show a generating state and poll `speeches.getById` until status becomes `finished` or `failed`. When publication `status` is not `published`, the card SHALL offer **Regenerate thumbnail** calling `speeches.regenerateThumbnail` with loading/disabled state while in flight. When publication `status` is `published`, **Regenerate thumbnail** SHALL NOT be shown.

#### Scenario: Thumbnail preview when finished

- **WHEN** an authenticated CMS user views a speech with `thumbnailProcessStatus` `finished`
- **THEN** the Thumbnail card displays the cover image preview

#### Scenario: Thumbnail generating state polls

- **WHEN** an authenticated CMS user views a speech with `thumbnailProcessStatus` `processing`
- **THEN** a generating indicator is shown and the client refreshes until status becomes `finished` or `failed`

#### Scenario: Manual regenerate thumbnail

- **WHEN** user clicks **Regenerate thumbnail** on an unpublished speech
- **THEN** `speeches.regenerateThumbnail` is invoked and the card returns to a generating state

#### Scenario: Thumbnail regenerate hidden while published

- **WHEN** user views a speech with publication `status` `published`
- **THEN** the Thumbnail card does not offer **Regenerate thumbnail**

## MODIFIED Requirements

### Requirement: CMS speech detail page

The CMS SHALL provide a page at `/cms/speeches/[speechId]` showing speech metadata (linked script title, voice name, language, TTS parameter values, timestamps, process status, and publication status), a **Publishing** card per `cms-speech-publishing` requirements, a **Thumbnail** card per thumbnail requirements, the full script text with synchronized chunk highlighting when alignment is stored and audio is playable (past chunks dimmed, active chunk highlighted, upcoming chunks normal, driven by audio playback time), and a waveform-based audio preview when `processStatus` is `finished` and audio is available. The page SHALL use the shared CMS page header with breadcrumbs **Speeches** (link to `/cms/speeches`) and the linked script title as the current segment instead of an in-page back link. While `processStatus` is `pending` or `processing`, the page SHALL show a generating state with chunk-based progress (percentage and chunk fraction when `totalChunks` is greater than zero) derived from `settledChunks` and `totalChunks`, and poll `speeches.getById` until the status becomes `finished` or `failed`. When `processStatus` is `pending` or `processing` and the speech is eligible for regenerate per `speeches.regenerate` rules (`processingStartedAt` null or at least 30 minutes ago for `processing`; always for `pending`), the generating card SHALL include a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When `processStatus` is `failed`, the page SHALL display `errorMessage` and a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When `processStatus` is `finished`, publication `status` is not `published`, and audio is playable, the audio preview section SHALL include a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When publication `status` is `published`, the audio preview section SHALL NOT show the standard **Regenerate** control. When the waveform player reports a load error, the audio preview section SHALL still offer **Regenerate** as a recovery action when publication `status` is not `published` (in addition to any existing open-in-new-tab link). When alignment is not stored (legacy speeches), the page SHALL display the script content without synchronized highlighting. The page SHALL provide a **Delete speech** control with a confirmation dialog that calls `speeches.delete` and, on success, navigates to `/cms/speeches` with a success toast. The delete control SHALL be blocked when publication `status` is `published` and SHALL remain available otherwise regardless of `processStatus`.

#### Scenario: View speech metadata

- **WHEN** an authenticated CMS user opens `/cms/speeches/{id}` for an existing speech
- **THEN** script title, voice name, language, TTS settings, process status, publication status, and timestamps are displayed below the page header breadcrumbs **Speeches** → script title

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

- **WHEN** an authenticated CMS user views a speech with `processStatus` `processing` and `processingStartedAt` at least 30 minutes ago
- **THEN** the generating card includes a regenerate control when not published

#### Scenario: Recent processing hides regenerate

- **WHEN** an authenticated CMS user views a speech with `processStatus` `processing` and `processingStartedAt` less than 30 minutes ago
- **THEN** the generating card does not offer regenerate

#### Scenario: Pending speech shows regenerate

- **WHEN** an authenticated CMS user views a speech with `processStatus` `pending`
- **THEN** the generating card includes a regenerate control when not published

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

- **WHEN** user deletes a speech with `processStatus` `pending` or `processing` and publication `status` is not `published`
- **THEN** the delete succeeds and the user is redirected to the speeches list

#### Scenario: Delete blocked while published

- **WHEN** user attempts to delete a speech with publication `status` `published`
- **THEN** delete is not available until the speech is unpublished
