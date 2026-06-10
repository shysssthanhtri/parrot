## MODIFIED Requirements

### Requirement: Script generation API

The system SHALL expose a tRPC `scriptGenerations.generate` mutation available to authenticated CMS users. The mutation SHALL accept `prompt` (non-empty string), `length` (one of `short`, `medium`, or `long`), `language` (a supported script language code), and optional `topicIds` (array of topic ID strings). It SHALL call the active LLM provider server-side via the provider strategy, persist a `ScriptGeneration` row for every attempt, and on success return `generationId`, `title`, and `content`.

When `topicIds` are provided and resolve to valid topics owned by the user, the system SHALL inject the topic names into the generation prompt to provide topical context to the LLM.

Target spoken durations for each length value SHALL be approximately: `short` — 30 seconds, `medium` — 1 minute, `long` — 5 minutes.

#### Scenario: Successful generation

- **WHEN** an authenticated CMS client calls `scriptGenerations.generate` with a non-empty `prompt`, valid `length`, and supported `language`
- **THEN** a `ScriptGeneration` row with `status` `success` is persisted and the procedure returns `generationId`, non-empty `title`, and non-empty `content`

#### Scenario: Generation with topic context

- **WHEN** an authenticated CMS client calls `scriptGenerations.generate` with valid `topicIds` referencing topics "Travel" and "Food"
- **THEN** the AI generation prompt SHALL include the topic names "Travel" and "Food" as contextual guidance

#### Scenario: Generation with empty or invalid topic IDs

- **WHEN** `scriptGenerations.generate` is called with `topicIds` as an empty array, omitted, or containing only invalid IDs
- **THEN** the generation proceeds without topic context injection (no error)

#### Scenario: Empty prompt rejected

- **WHEN** `scriptGenerations.generate` is called with a blank `prompt`
- **THEN** the procedure returns a validation error and no `ScriptGeneration` row is created

#### Scenario: Unsupported length rejected

- **WHEN** `scriptGenerations.generate` is called with a `length` value not in `short`, `medium`, or `long`
- **THEN** the procedure returns a validation error and no `ScriptGeneration` row is created

#### Scenario: Unsupported language rejected

- **WHEN** `scriptGenerations.generate` is called with a `language` value not in the supported script language set
- **THEN** the procedure returns a validation error and no `ScriptGeneration` row is created

#### Scenario: Generation service failure

- **WHEN** the active LLM provider is unavailable or returns unusable output after inputs are validated
- **THEN** a `ScriptGeneration` row with `status` `failed` is persisted and the procedure returns an error with a user-safe message
