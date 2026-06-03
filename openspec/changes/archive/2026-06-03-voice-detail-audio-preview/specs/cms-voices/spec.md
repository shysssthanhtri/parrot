## MODIFIED Requirements

### Requirement: Audio preview on detail page

When the voice has `r2ObjectKey` set, the detail page SHALL render a waveform-based audio player using a presigned URL. The player SHALL display a visual waveform of the sample, provide play/pause transport controls, show elapsed and total duration, and allow seeking by interacting with the waveform. When `r2ObjectKey` is null, the page SHALL show metadata without a player (or a clear empty state) and SHALL NOT error.

#### Scenario: Preview available

- **WHEN** user views detail for a voice with `r2ObjectKey`
- **THEN** a waveform player loads and plays the R2 object via presigned URL with visible waveform, transport controls, and time display

#### Scenario: Seek during preview

- **WHEN** user clicks or drags on the waveform while preview is loaded
- **THEN** playback position updates to the corresponding point in the sample

#### Scenario: No audio yet

- **WHEN** user views detail for a voice without `r2ObjectKey`
- **THEN** metadata is shown and no audio player is offered (or a non-blocking empty message)
