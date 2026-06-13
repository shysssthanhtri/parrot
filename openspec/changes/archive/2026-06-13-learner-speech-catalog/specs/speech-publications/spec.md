## MODIFIED Requirements

### Requirement: Speech publication model

The system SHALL persist learner-facing publication data in PostgreSQL using a Prisma `SpeechPublication` model with fields: `id`, `speechId` (required, unique FK to `Speech` with `onDelete: Cascade`), `status` (non-null string: `published` or `unpublished`), nullable `publishedAt`, frozen snapshot fields (`title`, `content`, `language`, `length` as one of `short`, `medium`, or `long`, `alignment` as JSON, `r2ObjectKey`, `thumbnailR2ObjectKey`, `voiceName`, `topicIds` as string array), and `createdAt` / `updatedAt`. A speech with no `SpeechPublication` row SHALL be treated as `not_published`. There SHALL be at most one publication row per speech.

#### Scenario: One publication row per speech

- **WHEN** a `SpeechPublication` row exists for a speech id
- **THEN** no second row for the same `speechId` can be created

#### Scenario: Speech delete cascades publication

- **WHEN** a `Speech` row is deleted
- **THEN** its linked `SpeechPublication` row is removed

### Requirement: Publication snapshot on publish

Publishing SHALL freeze a learner snapshot from the current authoring state: `title` and `content` from the linked script, `length` from the linked script, `language`, `alignment`, `r2ObjectKey`, and `thumbnailR2ObjectKey` from the speech, `voiceName` from the linked voice, and `topicIds` from the script's linked topics at publish time. Publish SHALL succeed only when the speech passes all publish readiness checks (including finished audio with valid alignment and final audio in storage, and finished thumbnail in storage). On first publish the system SHALL create the publication row. On republish the system SHALL update the same row, overwrite all snapshot fields, set `status` to `published`, and set `publishedAt` to the current time.

#### Scenario: First publish creates snapshot

- **WHEN** an authenticated CMS client publishes a speech that passes all readiness checks and has never been published
- **THEN** a `SpeechPublication` row is created with frozen snapshot fields including `length`, `thumbnailR2ObjectKey`, `status` is `published`, and `publishedAt` is set

#### Scenario: Republish updates existing row

- **WHEN** an authenticated CMS client publishes a speech that already has a publication row with `status` `unpublished` and passes all readiness checks
- **THEN** the same row is updated with a fresh snapshot including `length` and `thumbnailR2ObjectKey`, `status` becomes `published`, and `publishedAt` is set to the current time

#### Scenario: Publish rejected when not finished

- **WHEN** publish is called for a speech that fails the audio-finished readiness check
- **THEN** the procedure returns a validation error and no publication row is created or updated

#### Scenario: Publish rejected without alignment

- **WHEN** publish is called for a speech that fails the alignment readiness check
- **THEN** the procedure returns a validation error

#### Scenario: Publish rejected without thumbnail

- **WHEN** publish is called for a speech that fails the thumbnail readiness check
- **THEN** the procedure returns a validation error and no publication row is created or updated

### Requirement: Published speeches list API for learners

The system SHALL expose a tRPC `speechPublications.list` query available to any authenticated user (not only CMS users). It SHALL return only rows with `status` `published`, ordered by `publishedAt` descending. It SHALL accept optional filters `language` (exact BCP-47 match) and `topicId` (publication `topicIds` contains the id). Each item SHALL include at minimum `id`, `title`, `language`, `length`, `voiceName`, `publishedAt`, `topicIds`, and a resolved `thumbnailUrl` from snapshot `thumbnailR2ObjectKey` when the object exists. It SHALL NOT expose TTS parameters, `processStatus`, chunk counters, or CMS-only authoring fields.

#### Scenario: List published speeches by language

- **WHEN** an authenticated user calls `speechPublications.list` with `language` `vi-VN`
- **THEN** only published publications with `language` `vi-VN` are returned

#### Scenario: List published speeches by topic

- **WHEN** an authenticated user calls `speechPublications.list` with `topicId` set to a topic linked at publish time
- **THEN** only published publications whose `topicIds` include that topic are returned

#### Scenario: Unpublished speeches omitted from learner list

- **WHEN** an authenticated user calls `speechPublications.list`
- **THEN** publications with `status` `unpublished` are not returned

#### Scenario: List includes thumbnail URL

- **WHEN** an authenticated user calls `speechPublications.list` and a published row has a snapshot thumbnail key with an existing object
- **THEN** that item includes a resolved `thumbnailUrl`

#### Scenario: List includes script length

- **WHEN** an authenticated user calls `speechPublications.list` for a published speech
- **THEN** each item includes snapshot `length` as one of `short`, `medium`, or `long`
