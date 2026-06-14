## ADDED Requirements

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

## MODIFIED Requirements

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
