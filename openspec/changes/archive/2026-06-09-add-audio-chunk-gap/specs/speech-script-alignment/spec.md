## MODIFIED Requirements

### Requirement: Alignment capture during TTS generation

The long-speech generation path SHALL measure each chunk WAV duration after synthesis and build `SpeechScriptAlignment` before concatenating chunk buffers into the final output. Alignment capture SHALL use the same chunk list and order as audio concatenation. For multi-chunk speech, each non-final segment's `endMs` SHALL include the inter-chunk silence gap inserted during concatenation so segments remain contiguous and cover the full audio duration with no timeline holes.

#### Scenario: Single-chunk script alignment

- **WHEN** script content fits in one TTS chunk
- **THEN** alignment contains one segment spanning the full audio duration with the full trimmed script text

#### Scenario: Multi-chunk script alignment

- **WHEN** script content is split into multiple TTS chunks
- **THEN** alignment contains one segment per chunk with cumulative timing matching the concatenated WAV duration including inter-chunk silence gaps

#### Scenario: Trailing gap included in segment timing

- **WHEN** script content is split into multiple TTS chunks and inter-chunk silence is inserted
- **THEN** each non-final segment's `endMs` equals the next segment's `startMs` and includes the trailing silence gap after that chunk's speech audio
