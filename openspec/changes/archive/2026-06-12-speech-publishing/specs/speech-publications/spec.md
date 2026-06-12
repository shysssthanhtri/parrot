## ADDED Requirements

### Requirement: Speech publication model

The system SHALL persist learner-facing publication data in PostgreSQL using a Prisma `SpeechPublication` model with fields: `id`, `speechId` (required, unique FK to `Speech` with `onDelete: Cascade`), `status` (non-null string: `published` or `unpublished`), nullable `publishedAt`, frozen snapshot fields (`title`, `content`, `language`, `alignment` as JSON, `r2ObjectKey`, `voiceName`, `topicIds` as string array), and `createdAt` / `updatedAt`. A speech with no `SpeechPublication` row SHALL be treated as `not_published`. There SHALL be at most one publication row per speech.

#### Scenario: One publication row per speech

- **WHEN** a `SpeechPublication` row exists for a speech id
- **THEN** no second row for the same `speechId` can be created

#### Scenario: Speech delete cascades publication

- **WHEN** a `Speech` row is deleted
- **THEN** its linked `SpeechPublication` row is removed

### Requirement: Publication snapshot on publish

Publishing SHALL freeze a learner snapshot from the current authoring state: `title` and `content` from the linked script, `language`, `alignment`, and `r2ObjectKey` from the speech, `voiceName` from the linked voice, and `topicIds` from the script's linked topics at publish time. Publish SHALL succeed only when the speech exists, `processStatus` is `finished`, stored `alignment` is present, and the final audio object exists at `r2ObjectKey`. On first publish the system SHALL create the publication row. On republish the system SHALL update the same row, overwrite all snapshot fields, set `status` to `published`, and set `publishedAt` to the current time.

#### Scenario: First publish creates snapshot

- **WHEN** an authenticated CMS client publishes a finished speech that has never been published
- **THEN** a `SpeechPublication` row is created with frozen snapshot fields, `status` is `published`, and `publishedAt` is set

#### Scenario: Republish updates existing row

- **WHEN** an authenticated CMS client publishes a speech that already has a publication row with `status` `unpublished`
- **THEN** the same row is updated with a fresh snapshot, `status` becomes `published`, and `publishedAt` is set to the current time

#### Scenario: Publish rejected when not finished

- **WHEN** publish is called for a speech with `processStatus` other than `finished`
- **THEN** the procedure returns a validation error and no publication row is created or updated

#### Scenario: Publish rejected without alignment

- **WHEN** publish is called for a finished speech with null `alignment`
- **THEN** the procedure returns a validation error

### Requirement: Publication unpublish API

The system SHALL expose a tRPC `speechPublications.unpublish` mutation that accepts a speech `id`. It SHALL succeed only when a publication row exists with `status` `published`. It SHALL set `status` to `unpublished` and SHALL NOT delete the row or snapshot fields.

#### Scenario: Unpublish live speech

- **WHEN** an authenticated CMS client unpublishes a speech with `status` `published`
- **THEN** `status` becomes `unpublished` and learners no longer see the speech in published catalog queries

#### Scenario: Unpublish rejected when not published

- **WHEN** unpublish is called for a speech with no publication row or `status` `unpublished`
- **THEN** the procedure returns a validation error

### Requirement: Publication unpublish and regenerate API

The system SHALL expose a tRPC `speechPublications.unpublishAndRegenerate` mutation that accepts a speech `id`. It SHALL succeed only when the speech exists, a publication row exists with `status` `published`, and the speech is otherwise eligible for `speeches.regenerate`. In one atomic operation it SHALL set publication `status` to `unpublished`, then perform the same reset and enqueue behavior as `speeches.regenerate`. If regeneration setup fails, publication status SHALL NOT remain changed without a successful regenerate reset.

#### Scenario: Unpublish and regenerate live speech

- **WHEN** an authenticated CMS client calls `unpublishAndRegenerate` for a published finished speech
- **THEN** publication `status` becomes `unpublished`, the speech returns to `pending` with chunks and audio cleared per regenerate rules, and a start job is enqueued

#### Scenario: Unpublish and regenerate rejected when not published

- **WHEN** `unpublishAndRegenerate` is called for a speech that is not `published`
- **THEN** the procedure returns a validation error

### Requirement: Publication CMS lookup API

The system SHALL expose a tRPC `speechPublications.getBySpeechId` query for CMS use that returns the publication row for a speech id, or `status: not_published` when no row exists.

#### Scenario: CMS reads not published state

- **WHEN** `getBySpeechId` is called for a speech with no publication row
- **THEN** the response indicates `not_published`

### Requirement: Published speeches list API for learners

The system SHALL expose a tRPC `speechPublications.list` query available to any authenticated user (not only CMS users). It SHALL return only rows with `status` `published`, ordered by `publishedAt` descending. It SHALL accept optional filters `language` (exact BCP-47 match) and `topicId` (publication `topicIds` contains the id). Each item SHALL include at minimum `id`, `title`, `language`, `voiceName`, `publishedAt`, and `topicIds`. It SHALL NOT expose TTS parameters, `processStatus`, chunk counters, or CMS-only authoring fields.

#### Scenario: List published speeches by language

- **WHEN** an authenticated user calls `speechPublications.list` with `language` `vi-VN`
- **THEN** only published publications with `language` `vi-VN` are returned

#### Scenario: List published speeches by topic

- **WHEN** an authenticated user calls `speechPublications.list` with `topicId` set to a topic linked at publish time
- **THEN** only published publications whose `topicIds` include that topic are returned

#### Scenario: Unpublished speeches omitted from learner list

- **WHEN** an authenticated user calls `speechPublications.list`
- **THEN** publications with `status` `unpublished` are not returned

### Requirement: Published speech detail API for learners

The system SHALL expose a tRPC `speechPublications.getById` query available to any authenticated user. It SHALL return a single publication by publication `id` only when `status` is `published`, including snapshot `title`, `content`, `language`, `alignment`, `voiceName`, `topicIds`, `publishedAt`, and a resolved playable `audioUrl` from `r2ObjectKey` when the object exists.

#### Scenario: Learner fetches published speech

- **WHEN** an authenticated user calls `speechPublications.getById` for a published publication id
- **THEN** the frozen snapshot and playable audio URL are returned

#### Scenario: Unpublished publication not found for learners

- **WHEN** `speechPublications.getById` is called for a publication with `status` `unpublished`
- **THEN** the procedure returns a not-found error
