## Why

Mobile swipe navigation on the learner speech catalog at `/learn` works correctly — users can swipe up or down to change speeches — but the motion feels stiff and disconnected. The card does not follow the finger during the gesture, and the post-swipe slide animation (0.5s, full-height travel) starts only after release, which breaks the Shorts-style browse metaphor users expect on mobile.

## What Changes

- Add interactive drag-follow on mobile so the active speech card moves with the user's finger during a vertical swipe, with a subtle preview of the adjacent card when available.
- Snap or spring back to the current card when the swipe does not pass the navigation threshold or hits the first/last speech boundary.
- Tune mobile transition timing and easing (shorter duration or spring physics) so completed swipes feel responsive without changing desktop keyboard/chevron behavior.
- Apply GPU-friendly transform hints on the animated card layer to reduce jank during drag and transition.
- Optionally reduce competing motion from the card gradient background during active mobile drag/transition.
- Preserve existing navigation rules: clamp at ends, hint dismissal, reduced-motion handling, and desktop controls unchanged.

## Capabilities

### New Capabilities

<!-- None — smoothness improvements extend existing learner catalog navigation -->

### Modified Capabilities

- `learner-space`: Add requirements for interactive mobile swipe motion (drag-follow, snap-back, and responsive transition feel) without changing navigation semantics.

## Impact

- **Learner UI**: `src/app/(client)/learn/_components/learner-speech-catalog.tsx` (primary); may extract a small mobile swipe wrapper component. Possible minor prop on `LearnerSpeechCard` or `BackgroundGradient` to pause ambient gradient animation during drag.
- **Dependencies**: Reuse existing `motion/react`; no new packages.
- **API / database / CMS**: No changes.
