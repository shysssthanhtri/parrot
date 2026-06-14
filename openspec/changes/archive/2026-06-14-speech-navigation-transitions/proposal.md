## Why

The learner speech catalog at `/learn` supports vertical navigation between speeches, but the active card swaps instantly. That abrupt change breaks the Shorts-style browse metaphor and makes it harder to perceive direction when moving between items. Adding a transition when navigating up or down will make browsing feel smoother and more intentional.

## What Changes

- Animate the speech card when the user navigates to the previous or next speech via keyboard (↑ / ↓) or the on-screen chevron buttons.
- Transition direction SHALL match navigation direction (e.g. next speech enters from below, previous from above).
- Preserve existing navigation rules: one card visible at a time, no wrap at first/last, and the navigation hint collapse behavior.
- Respect `prefers-reduced-motion`: skip or minimize animation when the user has reduced motion enabled.

## Capabilities

### New Capabilities

<!-- None — transition behavior extends the existing learner catalog -->

### Modified Capabilities

- `learner-space`: Add requirements for animated transitions during speech catalog navigation, including reduced-motion handling.

## Impact

- **Learner UI**: `src/app/(client)/learn/_components/learner-speech-catalog.tsx` (primary); may extract a small transition wrapper component alongside existing `LearnerSpeechCard`.
- **Dependencies**: Reuse existing `motion/react` (already used by `BackgroundGradient` on the card).
- **API / database / CMS**: No changes.
