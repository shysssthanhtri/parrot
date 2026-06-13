## REMOVED Requirements

### Requirement: Learner space v1 welcome state

**Reason**: Replaced by a browse-only published speech catalog on `/learn`. The coming-soon placeholder is no longer needed.

**Migration**: Remove the coming-soon empty state from `src/app/learn/page.tsx` when implementing the catalog carousel.

## ADDED Requirements

### Requirement: Learner speech catalog browse

The learner space page at `/learn` SHALL fetch published speeches via `speechPublications.list` and display them as a vertical Shorts-style catalog. Exactly one speech card SHALL be visible at a time. Each card SHALL show the publication thumbnail (portrait aspect), title, script length label (`Short`, `Medium`, or `Long`), language label, and voice name. Audio playback, a Start control, and player overlay SHALL NOT be included in this change.

#### Scenario: Catalog displays published speeches

- **WHEN** an authenticated user loads `/learn` and at least one speech is published
- **THEN** the first published speech (most recently published) is shown as a single portrait card with title, length label, language, voice name, and thumbnail when available

#### Scenario: Keyboard navigation between speeches

- **WHEN** an authenticated user presses ArrowDown while viewing speech _n_ of _m_ published speeches and _n_ < _m_
- **THEN** the catalog advances to speech _n + 1_ and updates the visible card

#### Scenario: Keyboard navigation at first speech

- **WHEN** an authenticated user presses ArrowUp while viewing the first published speech
- **THEN** the focused speech remains the first speech (navigation does not wrap)

#### Scenario: Keyboard navigation at last speech

- **WHEN** an authenticated user presses ArrowDown while viewing the last published speech
- **THEN** the focused speech remains the last speech (navigation does not wrap)

#### Scenario: Position indicator

- **WHEN** an authenticated user views the catalog with multiple published speeches
- **THEN** the UI displays the current position within the total count (e.g. 2 / 5)

### Requirement: Learner catalog empty state

When no speeches are published, the learner space page SHALL display an empty state explaining that no speeches are available yet. It SHALL NOT show the previous coming-soon placeholder copy.

#### Scenario: No published speeches

- **WHEN** an authenticated user loads `/learn` and `speechPublications.list` returns an empty array
- **THEN** an empty state is displayed and no speech card is shown
