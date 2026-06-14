## Why

The learner speech catalog at `/learn` uses keyboard arrows and on-screen chevron buttons for navigation. On mobile devices, chevron buttons are awkward to reach and do not match the Shorts-style vertical browse pattern users expect. Swipe gestures are the natural mobile interaction for moving between speeches.

## What Changes

- On mobile viewports, enable vertical swipe navigation on the speech card area: swipe up for next speech, swipe down for previous speech.
- On mobile viewports, hide the chevron arrow buttons; desktop keeps keyboard and chevron controls unchanged.
- Show a mobile-specific navigation hint (e.g. "Swipe up or down to browse speeches") instead of the desktop "Use ↑ ↓ to browse speeches" hint.
- Dismiss the navigation hint after the user's first successful navigation (swipe, keyboard, or chevron), preserving existing collapse behavior.
- Apply swipe navigation transitions consistently with existing directional slide animations and reduced-motion handling.

## Capabilities

### New Capabilities

<!-- None — mobile swipe extends existing learner catalog navigation -->

### Modified Capabilities

- `learner-space`: Add mobile swipe navigation, mobile-specific hint copy, hide chevrons on mobile, and hint dismissal on first navigation.

## Impact

- **Learner UI**: `src/app/(client)/learn/_components/learner-speech-catalog.tsx` (primary); may reuse `useIsMobile` from `src/hooks/use-mobile.ts`.
- **Dependencies**: No new packages; touch handling via pointer/touch events or existing motion patterns.
- **API / database / CMS**: No changes.
