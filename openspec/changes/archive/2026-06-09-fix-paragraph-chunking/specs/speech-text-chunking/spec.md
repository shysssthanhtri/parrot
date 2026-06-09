## MODIFIED Requirements

### Requirement: Script text chunking

The system SHALL provide a server-side utility that splits script text into ordered chunks for TTS. Each chunk MUST be non-empty, MUST NOT exceed the configured maximum character length (default aligned with the Chatterbox `prompt` cap of 5000), and SHALL prefer breaking at paragraph boundaries (`\n\n`), then line boundaries (`\n`), then sentence boundaries (`.`, `!`, `?`, `。`, `！`, `？` followed by whitespace or end-of-text), before hard-splitting mid-sentence when no boundary fits within the limit. Ellipsis sequences (`...`, `..`, or Unicode `…`) SHALL be treated as a sentence boundary only when the next word after optional whitespace starts with an uppercase ASCII letter (`A`–`Z`), or when no further text follows; otherwise ellipsis MUST NOT split the chunk. Individual period characters within an ellipsis run MUST NOT be treated as sentence boundaries on their own. Short text that fits in a single chunk MUST return a one-element array equal to the trimmed input.

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

#### Scenario: Ellipsis with lowercase continuation stays together

- **WHEN** script content contains an ellipsis followed by a lowercase word (e.g. `a little... contained, maybe?`) and the full phrase fits within the maximum
- **THEN** chunking keeps the ellipsis and following words in the same chunk rather than breaking after the ellipsis

#### Scenario: Ellipsis with uppercase continuation splits

- **WHEN** script content contains an ellipsis followed by an uppercase word (e.g. `She paused... Then she left.`) and a chunk boundary is needed within that passage
- **THEN** chunking MAY break after the ellipsis before the uppercase word

#### Scenario: Line breaks respected before sentence splits

- **WHEN** script content contains a single line break within the chunk window and no earlier paragraph break
- **THEN** chunking breaks at the line boundary before breaking at sentence punctuation
