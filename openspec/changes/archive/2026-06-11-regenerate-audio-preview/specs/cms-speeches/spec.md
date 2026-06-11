## MODIFIED Requirements

### Requirement: CMS speech detail page

The CMS SHALL provide a page at `/cms/speeches/[speechId]` showing speech metadata (linked script title, voice name, language, TTS parameter values, timestamps, and process status), the full script text with synchronized chunk highlighting when alignment is stored and audio is playable (past chunks dimmed, active chunk highlighted, upcoming chunks normal, driven by audio playback time), and a waveform-based audio preview when `processStatus` is `finished` and audio is available. While `processStatus` is `pending` or `processing`, the page SHALL show a generating state with chunk-based progress (percentage and chunk fraction when `totalChunks` is greater than zero) derived from `settledChunks` and `totalChunks`, and poll `speeches.getById` until the status becomes `finished` or `failed`. When `processStatus` is `pending` or `processing` and the speech is eligible for regenerate per `speeches.regenerate` rules (`processingStartedAt` null or at least 30 minutes ago for `processing`; always for `pending`), the generating card SHALL include a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When `processStatus` is `failed`, the page SHALL display `errorMessage` and a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When `processStatus` is `finished` and audio is playable, the audio preview section SHALL include a **Regenerate** control that calls `speeches.regenerate`, shows a loading/disabled state while the request is in flight, and resumes polling until processing completes or fails again. When the waveform player reports a load error, the audio preview section SHALL still offer **Regenerate** as a recovery action (in addition to any existing open-in-new-tab link). When alignment is not stored (legacy speeches), the page SHALL display the script content without synchronized highlighting. The page SHALL provide a **Delete speech** control with a confirmation dialog that calls `speeches.delete` and, on success, navigates to `/cms/speeches` with a success toast. The delete control SHALL be available regardless of `processStatus`.

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
