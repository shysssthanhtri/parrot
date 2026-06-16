## MODIFIED Requirements

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
