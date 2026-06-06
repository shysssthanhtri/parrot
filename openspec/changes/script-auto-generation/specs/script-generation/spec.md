## ADDED Requirements

### Requirement: ScriptGeneration persistence model

The system SHALL persist script AI generation attempts in PostgreSQL using a Prisma `ScriptGeneration` model with fields: `id`, `prompt` (text), `length` (`short`, `medium`, or `long`), `language`, optional `generatedTitle`, optional `generatedContent` (text), `status` (`success` or `failed`), optional `errorMessage`, `model` (LLM identifier), optional `userId` (requesting user), optional `scriptId` (linked script after save), and `createdAt`.

#### Scenario: Successful generation row

- **WHEN** a generation completes successfully
- **THEN** a `ScriptGeneration` row is created with `status` `success`, the input `prompt`, `length`, and `language`, non-empty `generatedTitle` and `generatedContent`, the model name, and `userId` of the requester

#### Scenario: Failed generation row

- **WHEN** a generation fails after inputs are validated
- **THEN** a `ScriptGeneration` row is created with `status` `failed`, the input `prompt`, `length`, and `language`, an `errorMessage`, and `userId` of the requester

### Requirement: Script generation API

The system SHALL expose a tRPC `scriptGenerations.generate` mutation available to authenticated CMS users. The mutation SHALL accept `prompt` (non-empty string), `length` (one of `short`, `medium`, or `long`), and `language` (a supported script language code). It SHALL call Google Gemini server-side, persist a `ScriptGeneration` row for every attempt, and on success return `generationId`, `title`, and `content`.

Target spoken durations for each length value SHALL be approximately: `short` — 30 seconds, `medium` — 1 minute, `long` — 5 minutes.

#### Scenario: Successful generation

- **WHEN** an authenticated CMS client calls `scriptGenerations.generate` with a non-empty `prompt`, valid `length`, and supported `language`
- **THEN** a `ScriptGeneration` row with `status` `success` is persisted and the procedure returns `generationId`, non-empty `title`, and non-empty `content`

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

- **WHEN** the Gemini API is unavailable or returns unusable output after inputs are validated
- **THEN** a `ScriptGeneration` row with `status` `failed` is persisted and the procedure returns an error with a user-safe message

### Requirement: Script generation list API

The system SHALL expose a tRPC `scriptGenerations.list` query available to authenticated CMS users that returns all `ScriptGeneration` rows ordered by `createdAt` descending (newest first).

#### Scenario: List generation history

- **WHEN** an authenticated CMS client calls `scriptGenerations.list`
- **THEN** all persisted `ScriptGeneration` rows are returned ordered by `createdAt` descending

### Requirement: Link generation to saved script

When a script is created from an AI draft, the system SHALL support linking the `ScriptGeneration` row to the new `Script` by setting `scriptId` on the generation record.

#### Scenario: Link on script create

- **WHEN** `scripts.create` is called with a valid `generationId` belonging to the same user, with `status` `success`, and no existing `scriptId`
- **THEN** the new script is created and the corresponding `ScriptGeneration.scriptId` is set to the new script's `id`

#### Scenario: Invalid generation link rejected

- **WHEN** `scripts.create` is called with a `generationId` that does not exist, belongs to another user, has `status` `failed`, or already has a `scriptId`
- **THEN** the procedure returns a validation error and no script row is created
