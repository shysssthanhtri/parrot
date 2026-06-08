## MODIFIED Requirements

### Requirement: Speech preview generation API

The system SHALL expose a tRPC `speeches.generatePreview` mutation that accepts `voiceId`, `scriptId`, `language`, and TTS parameters. The procedure SHALL validate that the voice and script exist, that their `language` values match the requested `language`, and that the voice has `r2ObjectKey` set. It SHALL synthesize audio for the full script content by splitting long text into TTS-safe chunks, calling the Chatterbox TTS client once per chunk with the same `voice_key` and generation parameters, concatenating the returned WAV segments, and returning the combined WAV as base64 without persisting a speech row.

#### Scenario: Successful preview

- **WHEN** an authenticated client calls `speeches.generatePreview` with a matching voice, script, and language where the voice has audio
- **THEN** non-empty WAV audio is returned as base64 covering the full script content and no speech row is created

#### Scenario: Long script preview is complete

- **WHEN** `speeches.generatePreview` is called for a script longer than a single Chatterbox prompt can faithfully synthesize
- **THEN** the returned audio reflects the entire script content, not only the first segment

#### Scenario: Preview rejects voice without audio

- **WHEN** `speeches.generatePreview` is called for a voice with null `r2ObjectKey`
- **THEN** the procedure returns a validation error and no TTS call is made

#### Scenario: Preview rejects language mismatch

- **WHEN** `speeches.generatePreview` is called with a language that does not match the selected voice or script
- **THEN** the procedure returns a validation error
