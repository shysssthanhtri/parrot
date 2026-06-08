## MODIFIED Requirements

### Requirement: Script metadata model

The system SHALL persist script metadata in PostgreSQL using a Prisma `Script` model with fields: `id`, `title`, `content` (text body), `contentLength` (integer, non-null, character count of `content`), `language` (string, default `en-US`), optional `userId` (creator), `createdAt`, and `updatedAt`.

#### Scenario: Script with minimal fields

- **WHEN** a script row exists with `title`, `content`, `contentLength`, and `language` set
- **THEN** the script is valid and listable

### Requirement: Script create API

The system SHALL expose a tRPC `scripts.create` mutation that accepts `title`, `content`, optional `language` (default `en-US`), and optional `generationId` (a `ScriptGeneration` id from a prior successful `scriptGenerations.generate` call), computes `contentLength` from `content.length` server-side, persists a new script, links the generation when `generationId` is valid, and returns the created row. The mutation SHALL NOT accept `contentLength` from the client.

#### Scenario: Successful create

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title` and `content`
- **THEN** a new script row is created with `language` set to the provided value or `en-US` when omitted, `contentLength` set to the character count of `content`, and returned with an `id`

#### Scenario: Create with generation link

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title` and `content` and a valid `generationId` for the same user
- **THEN** a new script row is created with computed `contentLength`, and the referenced `ScriptGeneration.scriptId` is set to the new script's `id`

#### Scenario: Invalid generation link on create

- **WHEN** `scripts.create` is called with a `generationId` that is invalid, already linked, failed, or owned by another user
- **THEN** the procedure returns a validation error and no script row is created

### Requirement: Script update API

The system SHALL expose a tRPC `scripts.update` mutation that accepts `id`, `title`, `content`, and `language`, recomputes `contentLength` from `content.length` server-side, updates the existing script, and returns the updated row or reports not found. The mutation SHALL NOT accept `contentLength` from the client.

#### Scenario: Successful update

- **WHEN** `scripts.update` is called with a valid `id` and new `title`, `content`, and `language`
- **THEN** the script row is updated with recomputed `contentLength` and returned

#### Scenario: Update unknown script

- **WHEN** `scripts.update` is called with a non-existent `id`
- **THEN** the procedure returns a not-found error
