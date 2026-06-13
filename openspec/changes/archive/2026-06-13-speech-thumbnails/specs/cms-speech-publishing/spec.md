## MODIFIED Requirements

### Requirement: CMS speech publishing card

The CMS speech detail page SHALL include a **Publishing** card between the metadata card and the audio preview section. The card SHALL display the publication status (`Not published`, `Published`, or `Unpublished`), human-readable status copy, and `publishedAt` when `status` is `published`. The metadata card SHALL also show a **Publication** field with the same status label.

#### Scenario: Not published speech shows publish control

- **WHEN** an authenticated CMS user views a finished speech with no publication row
- **THEN** the Publishing card shows **Not published** and a **Publish** control

#### Scenario: Published speech shows live status

- **WHEN** an authenticated CMS user views a speech with publication `status` `published`
- **THEN** the Publishing card shows **Published**, the live-since timestamp, and **Unpublish**

#### Scenario: Unpublished speech shows republish control

- **WHEN** an authenticated CMS user views a speech with publication `status` `unpublished`
- **THEN** the Publishing card shows **Unpublished** and a **Publish** control

### Requirement: CMS publish and unpublish actions

The Publishing card SHALL call `speechPublications.publish` when the user activates **Publish**, and `speechPublications.unpublish` when the user activates **Unpublish**. **Publish** SHALL be enabled only when `speeches.getPublishReadiness` returns no issues for the current speech. When disabled, the card SHALL explain the blocking readiness issues (e.g. unfinished audio, pending thumbnail). Each action SHALL show a loading/disabled state while the request is in flight and SHALL refresh speech and publication data on success.

#### Scenario: Publish finished speech

- **WHEN** user clicks **Publish** on a speech with no readiness issues and confirms success
- **THEN** the card updates to **Published** and a success toast is shown

#### Scenario: Publish disabled while generating audio

- **WHEN** user views a speech whose readiness includes an audio-not-finished issue
- **THEN** **Publish** is disabled with copy explaining that publishing requires finished audio

#### Scenario: Publish disabled while thumbnail generating

- **WHEN** user views a speech whose readiness includes a thumbnail-not-ready issue
- **THEN** **Publish** is disabled with copy explaining that publishing requires a finished thumbnail

#### Scenario: Unpublish with confirmation

- **WHEN** user clicks **Unpublish** on a published speech and confirms the dialog
- **THEN** `speechPublications.unpublish` is called, the card updates to **Unpublished**, and a success toast is shown

## REMOVED Requirements

### Requirement: CMS unpublish and regenerate action

**Reason**: Replaced by separate **Unpublish**, **Regenerate** (audio), and **Regenerate thumbnail** controls.

**Migration**: Unpublish the speech, regenerate audio and/or thumbnail as needed, then publish again when readiness checks pass.

## ADDED Requirements

### Requirement: Regenerate hidden while published

When publication `status` is `published`, the audio preview section SHALL NOT show the standard **Regenerate** control and the thumbnail section SHALL NOT show **Regenerate thumbnail**.

#### Scenario: Regenerate hidden while published

- **WHEN** user views a published finished speech with playable audio
- **THEN** the audio preview card does not show the standard **Regenerate** button and the thumbnail section does not show regenerate

#### Scenario: Regenerate returns after unpublish

- **WHEN** publication `status` is `not_published` or `unpublished`
- **THEN** the standard **Regenerate** and **Regenerate thumbnail** controls are available per eligibility rules
