## MODIFIED Requirements

### Requirement: Script create API

The system SHALL expose a tRPC `scripts.create` mutation that accepts `title`, `content`, optional `language` (default `en-US`), and optional `generationId` (a `ScriptGeneration` id from a prior successful `scriptGenerations.generate` call), persists a new script, links the generation when `generationId` is valid, and returns the created row.

#### Scenario: Successful create

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title` and `content`
- **THEN** a new script row is created with `language` set to the provided value or `en-US` when omitted, and returned with an `id`

#### Scenario: Create with generation link

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title` and `content` and a valid `generationId` for the same user
- **THEN** a new script row is created and the referenced `ScriptGeneration.scriptId` is set to the new script's `id`

#### Scenario: Invalid generation link on create

- **WHEN** `scripts.create` is called with a `generationId` that is invalid, already linked, failed, or owned by another user
- **THEN** the procedure returns a validation error and no script row is created
