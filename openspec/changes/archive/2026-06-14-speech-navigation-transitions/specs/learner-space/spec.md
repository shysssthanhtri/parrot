## ADDED Requirements

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
