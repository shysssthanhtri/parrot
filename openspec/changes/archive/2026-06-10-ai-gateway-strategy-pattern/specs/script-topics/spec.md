## MODIFIED Requirements

### Requirement: AI color suggestion

The system SHALL expose a tRPC `topics.suggestColor` mutation available to authenticated CMS users that accepts a `name` (non-empty string) and optional `description` (string) and returns a hex color string suggested by the active LLM provider based on the topic name's semantic meaning.

#### Scenario: Successful color suggestion

- **WHEN** an authenticated CMS user calls `topics.suggestColor` with a non-empty `name`
- **THEN** the system returns a valid hex color string contextually appropriate for the name

#### Scenario: Empty name rejected

- **WHEN** `topics.suggestColor` is called with a blank `name`
- **THEN** the procedure returns a validation error

#### Scenario: AI service failure

- **WHEN** the active LLM provider is unavailable or returns unusable output
- **THEN** the procedure returns an error with a user-safe message

#### Scenario: Suggest color button in form

- **WHEN** a user has entered a topic name and clicks the suggest color button
- **THEN** the system calls `topics.suggestColor` and updates the color selection with the result
