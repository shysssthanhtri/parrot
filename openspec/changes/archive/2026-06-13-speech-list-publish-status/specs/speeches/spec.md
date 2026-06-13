## MODIFIED Requirements

### Requirement: Speeches list API

The system SHALL expose a tRPC `speeches.list` query that returns all speeches ordered for CMS display (by `updatedAt` descending), including voice name, script title, `processStatus`, and publication summary for display. Publication summary SHALL match the shape used by `speeches.getById`: `{ status: 'not_published' }` when no `SpeechPublication` row exists, or `{ status: 'published' | 'unpublished', publishedAt }` when a row exists.

#### Scenario: List all speeches

- **WHEN** an authenticated CMS client calls `speeches.list`
- **THEN** all speech rows are returned with associated voice name, script title, process status, and publication summary

#### Scenario: List includes published status

- **WHEN** `speeches.list` is called and a speech has publication `status` `published`
- **THEN** that row includes publication summary with `status` `published` and `publishedAt`

#### Scenario: List reports not published

- **WHEN** `speeches.list` is called and a speech has no publication row
- **THEN** that row includes publication summary with `status` `not_published`
