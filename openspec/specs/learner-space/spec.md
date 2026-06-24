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

When the learner advances or retreats between speeches in the catalog, the visible speech card SHALL animate between items instead of swapping instantly. The animation direction SHALL match navigation direction: moving to the next speech animates upward (incoming card from below), moving to the previous speech animates downward (incoming card from above). The transition SHALL apply consistently for keyboard navigation (↑ / ↓), on-screen chevron controls on desktop, and vertical swipe gestures on mobile.

#### Scenario: Next speech transition

- **WHEN** an authenticated user navigates from speech _n_ to speech _n + 1_ via ArrowDown, the next chevron, or an upward swipe on mobile
- **THEN** the outgoing card exits upward and the incoming card enters from below with a visible transition

#### Scenario: Previous speech transition

- **WHEN** an authenticated user navigates from speech _n_ to speech _n − 1_ via ArrowUp, the previous chevron, or a downward swipe on mobile
- **THEN** the outgoing card exits downward and the incoming card enters from above with a visible transition

#### Scenario: Reduced motion preference

- **WHEN** an authenticated user has `prefers-reduced-motion: reduce` enabled and navigates between speeches
- **THEN** the catalog updates the active speech without directional slide animation (instant or minimal crossfade only)

### Requirement: Learner speech catalog windowed thumbnail loading

The learner speech catalog SHALL load publication thumbnails only within a sliding window of three speeches: the focused speech at index _n_ and the next two speeches at indices _n + 1_ and _n + 2_. On initial catalog load with the first speech focused, the client SHALL load thumbnails for indices 0, 1, and 2. When the focused index changes, the client SHALL extend loading to cover the new focused speech and the next two speeches. Speeches without a `thumbnailUrl` SHALL be skipped. Speeches outside the load window SHALL NOT initiate thumbnail image requests and SHALL display the existing placeholder cover UI. Thumbnail loading SHALL NOT block rendering of the active card or navigation transitions. Only the initially visible thumbnail (index 0 on first paint) SHALL use high-priority loading.

#### Scenario: Initial load loads first three thumbnails

- **WHEN** an authenticated user loads `/learn` with at least three published speeches and the first speech is focused
- **THEN** the client loads thumbnail images only for speeches at indices 0, 1, and 2 (when those speeches have `thumbnailUrl` values) and does not load thumbnails for speeches at index 3 or beyond

#### Scenario: Window updates on navigation

- **WHEN** an authenticated user navigates from speech _n_ to speech _n + 1_ in a catalog with more than _n + 2_ speeches
- **THEN** the client loads thumbnails for speeches at indices _n + 1_, _n + 2_, and _n + 3_ as needed (when those speeches have `thumbnailUrl` values) and does not load thumbnails beyond index _n + 3_ unless the focused index advances again

#### Scenario: Window near end of catalog

- **WHEN** an authenticated user focuses a speech where fewer than two speeches remain after the focused index
- **THEN** the client loads thumbnails only for the focused speech and the remaining next speeches that have `thumbnailUrl` values and does not attempt to load beyond the last speech

#### Scenario: No thumbnail URL

- **WHEN** a speech in the load window has no `thumbnailUrl`
- **THEN** the client skips loading for that speech and continues loading other eligible speeches in the window

#### Scenario: Placeholder outside load window

- **WHEN** a speech is rendered in the carousel but its index is outside the current load window and its thumbnail has not been loaded in the session
- **THEN** the card displays the placeholder cover UI and does not initiate a thumbnail image request

#### Scenario: Priority on first visible thumbnail only

- **WHEN** an authenticated user loads `/learn` with at least one published speech that has a `thumbnailUrl`
- **THEN** only the thumbnail for the first focused speech (index 0) is requested with high priority; other thumbnails in the initial window load without high priority

### Requirement: Learner speech catalog mobile swipe navigation

On mobile viewports, the learner speech catalog SHALL support vertical swipe gestures on the speech card area to navigate between speeches. Swiping up SHALL advance to the next speech; swiping down SHALL retreat to the previous speech. Swipe navigation SHALL obey the same clamp rules as keyboard and chevron navigation (no wrap at first or last speech). On mobile viewports, the on-screen chevron navigation buttons SHALL NOT be displayed.

#### Scenario: Swipe up to next speech

- **WHEN** an authenticated user on a mobile viewport swipes up on the speech card while viewing speech _n_ of _m_ published speeches and _n_ < _m_
- **THEN** the catalog advances to speech _n + 1_ with the same directional transition as other navigation inputs

#### Scenario: Swipe down to previous speech

- **WHEN** an authenticated user on a mobile viewport swipes down on the speech card while viewing speech _n_ of _m_ published speeches and _n_ > 1\_
- **THEN** the catalog retreats to speech _n − 1_ with the same directional transition as other navigation inputs

#### Scenario: Swipe at first speech

- **WHEN** an authenticated user on a mobile viewport swipes down while viewing the first published speech
- **THEN** the focused speech remains the first speech (navigation does not wrap)

#### Scenario: Swipe at last speech

- **WHEN** an authenticated user on a mobile viewport swipes up while viewing the last published speech
- **THEN** the focused speech remains the last speech (navigation does not wrap)

#### Scenario: Chevrons hidden on mobile

- **WHEN** an authenticated user views the catalog on a mobile viewport
- **THEN** the previous and next chevron buttons are not visible

#### Scenario: Chevrons visible on desktop

- **WHEN** an authenticated user views the catalog on a desktop viewport
- **THEN** the previous and next chevron buttons remain available alongside keyboard navigation

### Requirement: Learner speech catalog navigation hint

The catalog SHALL display a first-visit navigation hint before the user navigates for the first time in the session. The hint SHALL use platform-appropriate copy: on desktop, keyboard-oriented text; on mobile, swipe-oriented text. After the user's first successful navigation (via swipe, keyboard, or chevron), the hint SHALL collapse and fade out and SHALL NOT reappear during the same page session.

#### Scenario: Desktop hint on first load

- **WHEN** an authenticated user loads the catalog on a desktop viewport and has not yet navigated
- **THEN** a hint referencing keyboard arrows (e.g. ↑ / ↓) is visible

#### Scenario: Mobile hint on first load

- **WHEN** an authenticated user loads the catalog on a mobile viewport and has not yet navigated
- **THEN** a hint referencing vertical swipe (e.g. swipe up or down) is visible

#### Scenario: Hint dismisses after first navigation

- **WHEN** an authenticated user successfully navigates to a different speech for the first time in the session (by swipe, keyboard, or chevron)
- **THEN** the navigation hint collapses and is no longer prominently visible

### Requirement: Learner speech catalog mobile swipe interactive motion

On mobile viewports, while the user performs a vertical swipe gesture on the speech card area, the active speech card SHALL move with the user's finger in real time. When navigation in the swipe direction is allowed, the adjacent speech card SHALL be partially visible as a preview during the drag. When the user releases a swipe that meets the navigation threshold or velocity, the motion SHALL be continuous with the gesture: the released card's position and release velocity SHALL flow directly into the settling animation, without first snapping the card back to its centered position, and the previewed adjacent card the user dragged toward SHALL be the card that settles into the active position. When the user releases without meeting the navigation threshold, or when navigation is blocked at the first or last speech, the active card SHALL animate back to its resting position smoothly rather than jumping instantly. Completed swipe navigation SHALL use a responsive, velocity-aware transition (spring or equivalent) so that a fast flick settles quickly and a gentle drag settles softly. When `prefers-reduced-motion: reduce` is enabled, interactive drag-follow and preview SHALL be skipped; navigation SHALL remain instant or minimal as today. Desktop keyboard and chevron navigation timing SHALL remain unchanged.

#### Scenario: Card follows finger during swipe

- **WHEN** an authenticated user on a mobile viewport presses and moves vertically on the speech card area
- **THEN** the active speech card translates vertically in sync with the finger position

#### Scenario: Adjacent speech preview during drag

- **WHEN** an authenticated user on a mobile viewport drags upward while viewing speech _n_ of _m_ published speeches and _n_ < _m_
- **THEN** the next speech card is partially visible below the active card during the drag

#### Scenario: Continuous handoff on committed swipe

- **WHEN** an authenticated user on a mobile viewport releases a vertical swipe that meets the distance or velocity threshold while navigation in that direction is allowed
- **THEN** the card continues moving from its released position into the settling animation without snapping back to center first, and the previewed adjacent card the user dragged toward settles into the active position

#### Scenario: Flick velocity carried into settle

- **WHEN** an authenticated user on a mobile viewport releases a fast flick that commits navigation
- **THEN** the settling animation reflects the release velocity, completing faster than a slow, gentle drag

#### Scenario: Preview blocked at boundary

- **WHEN** an authenticated user on a mobile viewport drags upward while viewing the last published speech
- **THEN** the active card resists further upward movement and no next speech preview is shown

#### Scenario: Snap back below threshold

- **WHEN** an authenticated user on a mobile viewport releases a vertical swipe with movement below the navigation threshold
- **THEN** the active card animates back to its centered resting position without changing the focused speech

#### Scenario: Reduced motion skips drag-follow

- **WHEN** an authenticated user on a mobile viewport has `prefers-reduced-motion: reduce` enabled and swipes on the speech card
- **THEN** the catalog navigates using threshold detection without interactive drag-follow or adjacent preview animation

### Requirement: Learner page dev server timing

In development, the `/learn` route SHALL emit a structured server-side timing breakdown for each request, covering at minimum layout auth, the `speechPublications.list` data fetch, database query time, and thumbnail resolution time, with the published speech count included in the log output.

#### Scenario: Dev timing visibility on learn page load

- **WHEN** a developer loads `/learn` in development with one or more published speeches
- **THEN** a structured timing log is written showing per-phase durations and publication count for that request

### Requirement: Learner page loading UI

While the `/learn` page is loading (server data fetch for `speechPublications.list` in progress), the app SHALL display a loading UI in the main content area that matches the speech catalog layout: a single centered portrait card skeleton with a cover-image placeholder, title placeholder, and metadata placeholder, constrained to the same max dimensions as the loaded speech carousel card. The learner layout header (`LearnHeader`) SHALL remain visible during loading. The loading UI SHALL NOT include chevron controls, navigation hints, position indicators, or empty-state copy.

#### Scenario: Loading skeleton during speech list fetch

- **WHEN** an authenticated user navigates to `/learn` and the page server component is still fetching published speeches
- **THEN** a portrait card-shaped skeleton is displayed centered in the main content area beneath the learner header

#### Scenario: Loading UI matches catalog card chrome

- **WHEN** the loading UI is visible on `/learn`
- **THEN** the skeleton uses a card-shaped layout with distinct cover, title, and metadata placeholder regions matching the loaded `SpeechCard` proportions

#### Scenario: Loading UI replaced by catalog

- **WHEN** `speechPublications.list` completes and the page renders
- **THEN** the loading UI is replaced by the speech carousel or empty state without requiring a full-page reload
