## MODIFIED Requirements

### Requirement: Published speeches list API for learners

The system SHALL expose a tRPC `speechPublications.list` query available to any authenticated user (not only CMS users). It SHALL return only rows with `status` `published`, ordered by `publishedAt` descending. It SHALL accept optional filters `language` (exact BCP-47 match) and `topicId` (publication `topicIds` contains the id). Each item SHALL include at minimum `id`, `title`, `language`, `length`, `voiceName`, `publishedAt`, `topicIds`, and a resolved `thumbnailUrl` presigned from snapshot `thumbnailR2ObjectKey` when that key is present (publish readiness guarantees the object existed at snapshot time; no runtime storage existence check is required on list). It SHALL NOT expose TTS parameters, `processStatus`, chunk counters, or CMS-only authoring fields.

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

- **WHEN** an authenticated user calls `speechPublications.list` and a published row has a non-null snapshot `thumbnailR2ObjectKey`
- **THEN** that item includes a presigned `thumbnailUrl` derived from the snapshot key

#### Scenario: List omits thumbnail URL when no snapshot key

- **WHEN** an authenticated user calls `speechPublications.list` and a published row has a null `thumbnailR2ObjectKey`
- **THEN** that item includes `thumbnailUrl` as null

#### Scenario: List includes script length

- **WHEN** an authenticated user calls `speechPublications.list` for a published speech
- **THEN** each item includes snapshot `length` as one of `short`, `medium`, or `long`
