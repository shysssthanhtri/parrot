# scripts Specification

## Purpose

TBD - created by archiving change scripts. Update Purpose after archive.

## Requirements

### Requirement: Script metadata model

The system SHALL persist script metadata in PostgreSQL using a Prisma `Script` model with fields: `id`, `title`, `content` (text body), `contentLength` (integer, non-null, character count of `content`), `language` (string, default `en-US`), optional `userId` (creator), `createdAt`, and `updatedAt`.

#### Scenario: Script with minimal fields

- **WHEN** a script row exists with `title`, `content`, `contentLength`, and `language` set
- **THEN** the script is valid and listable

### Requirement: Scripts list API

The system SHALL expose a tRPC `scripts.list` query that returns all scripts ordered for CMS display (by `updatedAt` descending), including associated topics for each script.

#### Scenario: List all scripts with topics

- **WHEN** an authenticated CMS client calls `scripts.list`
- **THEN** all script rows are returned with their associated topics included

### Requirement: Script detail API

The system SHALL expose a tRPC `scripts.getById` query that returns a single script by `id` including its associated topics and a speech count (`_count.speeches`), or reports not found.

#### Scenario: Get script with topics and speech count

- **WHEN** `scripts.getById` is called with a valid `id`
- **THEN** the script is returned with its associated topics included and `_count.speeches` reflecting the number of linked speeches

#### Scenario: Unknown script id

- **WHEN** `scripts.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error

### Requirement: Script create API

The system SHALL expose a tRPC `scripts.create` mutation that accepts `title`, `content`, optional `language` (default `en-US`), optional `generationId` (a `ScriptGeneration` id from a prior successful `scriptGenerations.generate` call), and optional `topicIds` (array of topic ID strings), computes `contentLength` from `content.length` server-side, persists a new script, links the generation when `generationId` is valid, connects the specified topics, and returns the created row including associated topics. The mutation SHALL NOT accept `contentLength` from the client. Invalid topic IDs (non-existent or not owned by user) SHALL be silently ignored.

#### Scenario: Successful create

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title` and `content`
- **THEN** a new script row is created with `language` set to the provided value or `en-US` when omitted, `contentLength` set to the character count of `content`, and returned with an `id`

#### Scenario: Create with generation link

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title` and `content` and a valid `generationId` for the same user
- **THEN** a new script row is created with computed `contentLength`, and the referenced `ScriptGeneration.scriptId` is set to the new script's `id`

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

The system SHALL expose a tRPC `scripts.update` mutation that accepts `id`, `title`, `content`, `language`, and optional `topicIds` (array of topic ID strings), recomputes `contentLength` from `content.length` server-side, updates the existing script, replaces topic associations with the provided set (using Prisma `set`), and returns the updated row including associated topics or reports not found. The mutation SHALL NOT accept `contentLength` from the client. Invalid topic IDs SHALL be silently ignored.

#### Scenario: Successful update

- **WHEN** `scripts.update` is called with a valid `id` and new `title`, `content`, and `language`
- **THEN** the script row is updated with recomputed `contentLength` and returned

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

`scripts.create` and `scripts.update` SHALL reject empty `title`, empty `content`, or unsupported `language` values with a validation error. Supported `language` values SHALL be: `en-US`, `vi-VN`, `zh-CN`, `ko-KR`, and `ja-JP`.

#### Scenario: Empty title on create

- **WHEN** `scripts.create` is called with blank `title`
- **THEN** the procedure returns a validation error and no row is created

#### Scenario: Empty content on update

- **WHEN** `scripts.update` is called with blank `content`
- **THEN** the procedure returns a validation error and the row is unchanged

#### Scenario: Unsupported language on create

- **WHEN** `scripts.create` is called with a `language` value not in the supported set
- **THEN** the procedure returns a validation error and no row is created

#### Scenario: Unsupported language on update

- **WHEN** `scripts.update` is called with a `language` value not in the supported set
- **THEN** the procedure returns a validation error and the row is unchanged

### Requirement: Script delete API

The system SHALL expose a tRPC `scripts.delete` mutation that accepts a script `id`. It SHALL succeed only when the script exists. Before deleting the script row, it SHALL delete all speeches linked to that script: for each speech, collect storage keys (`r2ObjectKey` and all `SpeechChunk.tempR2Key` values), call `deleteObjects`, then delete the speech row (cascading `SpeechChunk` rows via the existing `onDelete: Cascade` foreign key). After all speeches are removed, it SHALL delete the script row, which disconnects topic associations and sets any linked `ScriptGeneration.scriptId` to null via the existing `onDelete: SetNull` foreign key. Linked `Topic` and `Voice` rows SHALL NOT be deleted. The procedure SHALL return `{ success: true }` on completion.

#### Scenario: Delete script with no speeches

- **WHEN** an authenticated CMS client calls `scripts.delete` for a script with zero linked speeches
- **THEN** the script row is removed, topic associations are cleared, and `{ success: true }` is returned

#### Scenario: Delete script with speeches cascades audio cleanup

- **WHEN** an authenticated CMS client calls `scripts.delete` for a script with one or more linked speeches (any `processStatus`)
- **THEN** all linked speech rows and their `SpeechChunk` rows are removed, all associated storage objects (final WAVs and temp chunk WAVs) are deleted, the script row is removed, and `{ success: true }` is returned

#### Scenario: Delete unknown script id

- **WHEN** `scripts.delete` is called with a non-existent id
- **THEN** the procedure returns a not-found error and no speeches or storage objects are deleted

#### Scenario: Topics and voices are preserved

- **WHEN** `scripts.delete` succeeds for a script linked to topics and speeches that reference voices
- **THEN** topic rows and voice rows remain in the database
