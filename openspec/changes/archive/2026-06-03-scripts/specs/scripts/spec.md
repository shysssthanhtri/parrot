## ADDED Requirements

### Requirement: Script metadata model

The system SHALL persist script metadata in PostgreSQL using a Prisma `Script` model with fields: `id`, `title`, `content` (text body), optional `userId` (creator), `createdAt`, and `updatedAt`.

#### Scenario: Script with minimal fields

- **WHEN** a script row exists with `title` and `content` set
- **THEN** the script is valid and listable

### Requirement: Scripts list API

The system SHALL expose a tRPC `scripts.list` query that returns all scripts ordered for CMS display (e.g. by `updatedAt` descending).

#### Scenario: List all scripts

- **WHEN** an authenticated CMS client calls `scripts.list`
- **THEN** all script rows are returned

### Requirement: Script detail API

The system SHALL expose a tRPC `scripts.getById` query that returns a single script by `id` or reports not found.

#### Scenario: Unknown script id

- **WHEN** `scripts.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error

### Requirement: Script create API

The system SHALL expose a tRPC `scripts.create` mutation that accepts `title` and `content`, persists a new script, and returns the created row.

#### Scenario: Successful create

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title` and `content`
- **THEN** a new script row is created and returned with an `id`

### Requirement: Script update API

The system SHALL expose a tRPC `scripts.update` mutation that accepts `id`, `title`, and `content`, updates the existing script, and returns the updated row or reports not found.

#### Scenario: Successful update

- **WHEN** `scripts.update` is called with a valid `id` and new `title`/`content`
- **THEN** the script row is updated and returned

#### Scenario: Update unknown script

- **WHEN** `scripts.update` is called with a non-existent `id`
- **THEN** the procedure returns a not-found error

### Requirement: Script input validation

`scripts.create` and `scripts.update` SHALL reject empty `title` or empty `content` with a validation error.

#### Scenario: Empty title on create

- **WHEN** `scripts.create` is called with blank `title`
- **THEN** the procedure returns a validation error and no row is created

#### Scenario: Empty content on update

- **WHEN** `scripts.update` is called with blank `content`
- **THEN** the procedure returns a validation error and the row is unchanged
