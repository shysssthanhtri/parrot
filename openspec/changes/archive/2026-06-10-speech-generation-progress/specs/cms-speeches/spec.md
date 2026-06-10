## MODIFIED Requirements

### Requirement: CMS speech detail page

The CMS SHALL provide a read-only page at `/cms/speeches/[speechId]` showing speech metadata (linked script title, voice name, language, TTS parameter values, timestamps, and process status), the full script text with synchronized chunk highlighting when alignment is stored and audio is playable (past chunks dimmed, active chunk highlighted, upcoming chunks normal, driven by audio playback time), and a waveform-based audio preview when `processStatus` is `finished` and audio is available. While `processStatus` is `pending` or `processing`, the page SHALL show a generating state with chunk-based progress (percentage and chunk fraction when `totalChunks` is greater than zero) derived from `settledChunks` and `totalChunks`, and poll `speeches.getById` until the status becomes `finished` or `failed`. When `processStatus` is `failed`, the page SHALL display `errorMessage` and a retry control that calls `speeches.retry` and resumes polling. When alignment is not stored (legacy speeches), the page SHALL display the script content without synchronized highlighting. The page SHALL NOT offer edit, archive, or delete controls in v1.

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
