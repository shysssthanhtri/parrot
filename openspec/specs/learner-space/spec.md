# learner-space Specification

## Purpose

TBD - created by archiving change learner-landing-page. Update Purpose after archive.

## Requirements

### Requirement: Learner space route

The app SHALL provide an authenticated learner space at `/learn` outside the CMS layout. Unauthenticated requests SHALL redirect to the public sign-in route with a callback URL of `/learn`.

#### Scenario: Learner space requires authentication

- **WHEN** an unauthenticated user navigates to `/learn`
- **THEN** the user is redirected to sign-in with a return path to `/learn`

#### Scenario: Authenticated user accesses learner space

- **WHEN** an authenticated user (CMS or non-CMS) navigates to `/learn`
- **THEN** the learner space page is displayed

#### Scenario: Learner space route constant

- **WHEN** application code references the learner home route
- **THEN** `ROUTES.LEARN.HOME` resolves to `/learn`

### Requirement: Learner space layout

The learner space SHALL use a dedicated public layout with a site header showing the Parrot brand and a sign-out control for authenticated users. The layout SHALL NOT include the CMS sidebar.

#### Scenario: Learner header with sign-out

- **WHEN** an authenticated user views `/learn`
- **THEN** a header with brand identity and sign-out is displayed without CMS navigation

#### Scenario: Sign-out returns to landing

- **WHEN** a user signs out from the learner space
- **THEN** the user is redirected to the public landing page or sign-in page

### Requirement: Post-auth default destination

Successful sign-in and sign-up flows for end users SHALL redirect to `/learn` as the default authenticated destination for non-CMS product entry.

#### Scenario: Post-auth callback constant

- **WHEN** application code references the default post-auth redirect for learners
- **THEN** `ROUTES.LEARN.HOME` (or a dedicated `ROUTES.PUBLIC.POST_AUTH` alias) resolves to `/learn`

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

### Requirement: Learner speech catalog navigation transition

When the learner advances or retreats between speeches in the catalog, the visible speech card SHALL animate between items instead of swapping instantly. The animation direction SHALL match navigation direction: moving to the next speech animates upward (incoming card from below), moving to the previous speech animates downward (incoming card from above). The transition SHALL apply consistently for keyboard navigation (↑ / ↓) and on-screen chevron controls.

#### Scenario: Next speech transition

- **WHEN** an authenticated user navigates from speech _n_ to speech _n + 1_ via ArrowDown or the next chevron
- **THEN** the outgoing card exits upward and the incoming card enters from below with a visible transition

#### Scenario: Previous speech transition

- **WHEN** an authenticated user navigates from speech _n_ to speech _n − 1_ via ArrowUp or the previous chevron
- **THEN** the outgoing card exits downward and the incoming card enters from above with a visible transition

#### Scenario: Reduced motion preference

- **WHEN** an authenticated user has `prefers-reduced-motion: reduce` enabled and navigates between speeches
- **THEN** the catalog updates the active speech without directional slide animation (instant or minimal crossfade only)
