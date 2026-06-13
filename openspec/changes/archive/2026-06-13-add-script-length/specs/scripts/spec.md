## MODIFIED Requirements

### Requirement: Script metadata model

The system SHALL persist script metadata in PostgreSQL using a Prisma `Script` model with fields: `id`, `title`, `content` (text body), `contentLength` (integer, non-null, character count of `content`), `length` (`short`, `medium`, or `long` — target spoken duration), `language` (string, default `en-US`), optional `userId` (creator), `createdAt`, and `updatedAt`.

Target spoken durations for each `length` value SHALL be approximately: `short` — 30 seconds, `medium` — 1 minute, `long` — 5 minutes.

#### Scenario: Script with minimal fields

- **WHEN** a script row exists with `title`, `content`, `contentLength`, `length`, and `language` set
- **THEN** the script is valid and listable

### Requirement: Script create API

The system SHALL expose a tRPC `scripts.create` mutation that accepts `title`, `content`, `length` (one of `short`, `medium`, or `long`), optional `language` (default `en-US`), optional `generationId` (a `ScriptGeneration` id from a prior successful `scriptGenerations.generate` call), and optional `topicIds` (array of topic ID strings), computes `contentLength` from `content.length` server-side, persists a new script, links the generation when `generationId` is valid, connects the specified topics, and returns the created row including associated topics. The mutation SHALL NOT accept `contentLength` from the client. When `generationId` is provided, the persisted `length` SHALL be taken from the linked `ScriptGeneration.length` row, not from the client payload. Invalid topic IDs (non-existent or not owned by user) SHALL be silently ignored.

#### Scenario: Successful create

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title`, `content`, and valid `length`
- **THEN** a new script row is created with `language` set to the provided value or `en-US` when omitted, `contentLength` set to the character count of `content`, `length` set to the provided value, and returned with an `id`

#### Scenario: Create with generation link

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title` and `content`, a valid `generationId` for the same user, and any client-supplied `length`
- **THEN** a new script row is created with computed `contentLength`, `length` set to the linked generation's `length`, and the referenced `ScriptGeneration.scriptId` is set to the new script's `id`

#### Scenario: Invalid generation link on create

- **WHEN** `scripts.create` is called with a `generationId` that is invalid, already linked, failed, or owned by another user
- **THEN** the procedure returns a validation error and no script row is created

#### Scenario: Create with topic IDs

- **WHEN** an authenticated CMS client calls `scripts.create` with `topicIds` containing valid topic IDs owned by the user
- **THEN** the new script is created and associated with the specified topics

#### Scenario: Create with empty topic IDs

- **WHEN** an authenticated CMS client calls `scripts.create` with `topicIds` as an empty array or omitted
- **THEN** the new script is created with no topic associations

### Requirement: Script update API

The system SHALL expose a tRPC `scripts.update` mutation that accepts `id`, `title`, `content`, `length` (one of `short`, `medium`, or `long`), `language`, and optional `topicIds` (array of topic ID strings), recomputes `contentLength` from `content.length` server-side, updates the existing script, replaces topic associations with the provided set (using Prisma `set`), and returns the updated row including associated topics or reports not found. The mutation SHALL NOT accept `contentLength` from the client. Invalid topic IDs SHALL be silently ignored.

#### Scenario: Successful update

- **WHEN** `scripts.update` is called with a valid `id`, new `title`, `content`, `length`, and `language`
- **THEN** the script row is updated with recomputed `contentLength` and persisted `length`, and returned

#### Scenario: Update unknown script

- **WHEN** `scripts.update` is called with a non-existent `id`
- **THEN** the procedure returns a not-found error

#### Scenario: Update with topic IDs replaces associations

- **WHEN** `scripts.update` is called with `topicIds` containing a new set of topic IDs
- **THEN** all previous topic associations are replaced with the new set

#### Scenario: Update with empty topic IDs clears associations

- **WHEN** `scripts.update` is called with `topicIds` as an empty array
- **THEN** all topic associations for the script are removed

### Requirement: Script input validation

`scripts.create` and `scripts.update` SHALL reject empty `title`, empty `content`, unsupported `length` values, or unsupported `language` values with a validation error. Supported `length` values SHALL be: `short`, `medium`, and `long`. Supported `language` values SHALL be: `en-US`, `vi-VN`, `zh-CN`, `ko-KR`, and `ja-JP`.

#### Scenario: Empty title on create

- **WHEN** `scripts.create` is called with blank `title`
- **THEN** the procedure returns a validation error and no row is created

#### Scenario: Empty content on update

- **WHEN** `scripts.update` is called with blank `content`
- **THEN** the procedure returns a validation error and the row is unchanged

#### Scenario: Unsupported length on create

- **WHEN** `scripts.create` is called with a `length` value not in `short`, `medium`, or `long`
- **THEN** the procedure returns a validation error and no row is created

#### Scenario: Unsupported length on update

- **WHEN** `scripts.update` is called with a `length` value not in `short`, `medium`, or `long`
- **THEN** the procedure returns a validation error and the row is unchanged

#### Scenario: Unsupported language on create

- **WHEN** `scripts.create` is called with a `language` value not in the supported set
- **THEN** the procedure returns a validation error and no row is created

#### Scenario: Unsupported language on update

- **WHEN** `scripts.update` is called with a `language` value not in the supported set
- **THEN** the procedure returns a validation error and the row is unchanged
