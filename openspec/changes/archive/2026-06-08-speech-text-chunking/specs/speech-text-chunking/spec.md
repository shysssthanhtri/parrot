## ADDED Requirements

### Requirement: Script text chunking

The system SHALL provide a server-side utility that splits script text into ordered chunks for TTS. Each chunk MUST be non-empty, MUST NOT exceed the configured maximum character length (default aligned with the Chatterbox `prompt` cap of 5000), and SHOULD prefer breaking at paragraph boundaries (`\n\n`), then sentence boundaries (`.`, `!`, `?`, and equivalent closing punctuation), before hard-splitting mid-sentence when no boundary fits within the limit. Short text that fits in a single chunk MUST return a one-element array equal to the trimmed input.

#### Scenario: Short text returns single chunk

- **WHEN** script content length is at or below the configured maximum
- **THEN** chunking returns one chunk containing the full trimmed text

#### Scenario: Long text splits at sentence boundaries

- **WHEN** script content exceeds the configured maximum and contains sentence-ending punctuation within the limit
- **THEN** chunks break at sentence boundaries and no chunk exceeds the maximum length

#### Scenario: Very long sentence hard-splits

- **WHEN** a single sentence exceeds the configured maximum with no earlier boundary
- **THEN** the utility hard-splits the sentence so every chunk respects the maximum length

#### Scenario: Paragraph boundaries preferred

- **WHEN** script content contains paragraph breaks and a paragraph fits within the maximum
- **THEN** chunking keeps paragraph content together in one chunk when possible

### Requirement: WAV buffer concatenation

The system SHALL provide a server-side utility that concatenates multiple `audio/wav` buffers into a single valid WAV buffer. All input buffers MUST share the same sample rate, channel count, and bit depth; otherwise the utility SHALL throw an error. The output MUST be playable as a single continuous WAV file.

#### Scenario: Concatenate compatible WAV segments

- **WHEN** two or more WAV buffers with matching format are concatenated
- **THEN** the result is a valid WAV whose duration equals the sum of input durations

#### Scenario: Single buffer passthrough

- **WHEN** concatenation is called with exactly one WAV buffer
- **THEN** the utility returns that buffer unchanged

#### Scenario: Incompatible formats rejected

- **WHEN** input WAV buffers have mismatched sample rate or channel count
- **THEN** the utility throws an error and does not return partial output
