## ADDED Requirements

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
