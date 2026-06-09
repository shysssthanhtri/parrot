## ADDED Requirements

### Requirement: Speech script alignment data shape

The system SHALL define a reusable `SpeechScriptAlignment` type with `version: 1` and an ordered `segments` array. Each segment SHALL contain `text` (string, the TTS chunk text as synthesized), `startMs` (non-negative integer, inclusive start time in milliseconds), and `endMs` (positive integer, exclusive end time in milliseconds). Segments SHALL be contiguous from `0` to the total audio duration with no gaps or overlaps.

#### Scenario: Valid alignment structure

- **WHEN** alignment is produced for a synthesized speech
- **THEN** `segments[0].startMs` is `0`, each `segments[i].endMs` equals `segments[i + 1].startMs`, and the last segment's `endMs` equals the total audio duration in milliseconds

#### Scenario: Segment text matches TTS chunks

- **WHEN** alignment is captured during long-text TTS generation
- **THEN** each segment's `text` matches the corresponding `splitTextForTts` chunk sent to Chatterbox for that audio slice

### Requirement: Alignment capture during TTS generation

The long-speech generation path SHALL measure each chunk WAV duration after synthesis and build `SpeechScriptAlignment` before concatenating chunk buffers into the final output. Alignment capture SHALL use the same chunk list and order as audio concatenation.

#### Scenario: Single-chunk script alignment

- **WHEN** script content fits in one TTS chunk
- **THEN** alignment contains one segment spanning the full audio duration with the full trimmed script text

#### Scenario: Multi-chunk script alignment

- **WHEN** script content is split into multiple TTS chunks
- **THEN** alignment contains one segment per chunk with cumulative timing matching the concatenated WAV duration

### Requirement: Shared alignment types for reuse

Alignment types and helpers SHALL live in a shared module importable by tRPC routers, CMS components, and future end-user surfaces without CMS-specific coupling.

#### Scenario: Server and client share types

- **WHEN** a developer imports alignment types for preview API or a sync viewer component
- **THEN** the same `SpeechScriptAlignment` definition is used in both contexts

### Requirement: Active segment resolution

Given a playback time in milliseconds and a `SpeechScriptAlignment`, the system SHALL resolve the active segment as the first segment where `startMs <= timeMs < endMs`. If `timeMs` is before the first segment or at/after the last segment's `endMs`, resolution SHALL clamp to the first or last segment respectively.

#### Scenario: Mid-playback segment lookup

- **WHEN** playback time is 15000 ms and a segment covers `[12000, 18000)`
- **THEN** that segment is the active segment

#### Scenario: Before start clamps to first

- **WHEN** playback time is 0 ms
- **THEN** the first segment is active
