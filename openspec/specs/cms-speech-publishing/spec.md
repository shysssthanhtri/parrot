# cms-speech-publishing Specification

## Purpose

TBD - created by archiving change speech-publishing. Update Purpose after archive.

## Requirements

### Requirement: CMS speech publishing card

The CMS speech detail page SHALL include a **Publishing** card between the metadata card and the audio preview section. The card SHALL display the publication status (`Not published`, `Published`, or `Unpublished`), human-readable status copy, and `publishedAt` when `status` is `published`. The metadata card SHALL also show a **Publication** field with the same status label.

#### Scenario: Not published speech shows publish control

- **WHEN** an authenticated CMS user views a finished speech with no publication row
- **THEN** the Publishing card shows **Not published** and a **Publish** control

#### Scenario: Published speech shows live status

- **WHEN** an authenticated CMS user views a speech with publication `status` `published`
- **THEN** the Publishing card shows **Published**, the live-since timestamp, **Unpublish**, and **Unpublish and regenerate…**

#### Scenario: Unpublished speech shows republish control

- **WHEN** an authenticated CMS user views a speech with publication `status` `unpublished`
- **THEN** the Publishing card shows **Unpublished** and a **Publish** control

### Requirement: CMS publish and unpublish actions

The Publishing card SHALL call `speechPublications.publish` when the user activates **Publish**, and `speechPublications.unpublish` when the user activates **Unpublish**. **Publish** SHALL be enabled only when `processStatus` is `finished`. Each action SHALL show a loading/disabled state while the request is in flight and SHALL refresh speech and publication data on success.

#### Scenario: Publish finished speech

- **WHEN** user clicks **Publish** on a finished, not-published speech and confirms success
- **THEN** the card updates to **Published** and a success toast is shown

#### Scenario: Publish disabled while generating

- **WHEN** user views a speech with `processStatus` `pending` or `processing`
- **THEN** **Publish** is disabled with copy explaining that publishing requires finished audio

#### Scenario: Unpublish with confirmation

- **WHEN** user clicks **Unpublish** on a published speech and confirms the dialog
- **THEN** `speechPublications.unpublish` is called, the card updates to **Unpublished**, and a success toast is shown

### Requirement: CMS unpublish and regenerate action

When publication `status` is `published`, the Publishing card SHALL offer **Unpublish and regenerate…** with a confirmation dialog explaining that the speech will be removed from the learner catalog, current audio and alignment will be deleted, and generation will restart. The user must republish manually when the new audio is ready. The audio preview section SHALL NOT show the standard **Regenerate** control while `status` is `published`.

#### Scenario: Unpublish and regenerate starts new generation

- **WHEN** user confirms **Unpublish and regenerate…** on a published finished speech
- **THEN** `speechPublications.unpublishAndRegenerate` is called, the page shows the generating state, and polling resumes until processing completes or fails

#### Scenario: Regenerate hidden while published

- **WHEN** user views a published finished speech with playable audio
- **THEN** the audio preview card does not show the standard **Regenerate** button

#### Scenario: Regenerate returns after unpublish

- **WHEN** publication `status` is `not_published` or `unpublished`
- **THEN** the standard **Regenerate** control is available per existing `cms-speeches` eligibility rules

### Requirement: CMS delete blocked while published

The **Delete speech** control on the detail page SHALL be disabled or SHALL explain that the speech must be unpublished first when publication `status` is `published`. It SHALL NOT send `speeches.delete` while the speech is live.

#### Scenario: Delete disabled for published speech

- **WHEN** user views a speech with publication `status` `published`
- **THEN** **Delete speech** cannot be used until the speech is unpublished
