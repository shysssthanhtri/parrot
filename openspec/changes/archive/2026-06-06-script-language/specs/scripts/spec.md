## MODIFIED Requirements

### Requirement: Script metadata model

The system SHALL persist script metadata in PostgreSQL using a Prisma `Script` model with fields: `id`, `title`, `content` (text body), `language` (string, default `en-US`), optional `userId` (creator), `createdAt`, and `updatedAt`.

#### Scenario: Script with minimal fields

- **WHEN** a script row exists with `title`, `content`, and `language` set
- **THEN** the script is valid and listable

### Requirement: Script create API

The system SHALL expose a tRPC `scripts.create` mutation that accepts `title`, `content`, and optional `language` (default `en-US`), persists a new script, and returns the created row.

#### Scenario: Successful create

- **WHEN** an authenticated CMS client calls `scripts.create` with non-empty `title` and `content`
- **THEN** a new script row is created with `language` set to the provided value or `en-US` when omitted, and returned with an `id`

### Requirement: Script update API

The system SHALL expose a tRPC `scripts.update` mutation that accepts `id`, `title`, `content`, and `language`, updates the existing script, and returns the updated row or reports not found.

#### Scenario: Successful update

- **WHEN** `scripts.update` is called with a valid `id` and new `title`, `content`, and `language`
- **THEN** the script row is updated and returned

#### Scenario: Update unknown script

- **WHEN** `scripts.update` is called with a non-existent `id`
- **THEN** the procedure returns a not-found error

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
