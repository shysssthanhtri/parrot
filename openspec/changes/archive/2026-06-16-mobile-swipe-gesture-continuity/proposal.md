## Why

Mobile swipe navigation on the learner speech catalog at `/learn` already follows the finger and previews the adjacent card, but completed swipes still feel disconnected from the gesture. On release, the dragged card is reset to center instantly (`dragY.set(0)`) and a separate `AnimatePresence` enter/exit then plays a fixed 0.5s tween — so the position the user dragged to is discarded, the flick velocity is lost, and the card the user was peeking at is unmounted and replaced by a fresh one sliding in. The result is a visible jump and sluggish, "two-stage" motion that breaks the Shorts-style browse feel learners expect when moving between speeches.

## What Changes

- Make the swipe commit **continuous with the drag**: the card the user releases hands off its current position and velocity directly into the settle animation instead of snapping to center first, eliminating the jump on commit.
- Carry **flick velocity** into the post-release motion so a fast flick settles quickly and a gentle drag settles gently (velocity-aware spring), replacing the fixed 0.5s tween on mobile.
- Keep the **adjacent preview card continuous through commit** so the speech the user dragged into view is the one that lands, rather than unmounting the preview and animating a fresh card in.
- Tune mobile settle timing/easing to feel responsive (spring or short-duration) while leaving desktop keyboard/chevron transitions unchanged.
- Apply compositor hints (`will-change` / GPU layer) only during active drag/settle to reduce jank on low-end phones, and pause the ambient card gradient during the gesture (existing behavior preserved).
- Preserve all existing navigation semantics: clamp at first/last, rubber-band at boundaries, hint dismissal, reduced-motion fallback, and unchanged desktop controls.

## Capabilities

### New Capabilities

<!-- None — this refines existing mobile swipe motion on the learner catalog -->

### Modified Capabilities

- `learner-space`: Strengthen the mobile swipe interactive-motion requirement so completed swipes are continuous with the drag (position + velocity handoff, no reset-to-center jump) and the dragged preview card is the one that settles into place.

## Impact

- **Learner UI**: `src/app/(client)/learn/_components/learner-speech-swipe-stack.tsx` (primary — gesture/commit refactor), with minor coordination in `learner-speech-catalog.tsx` (navigation dispatch) and possible prop use on `learner-speech-card.tsx` / `BackgroundGradient` for gesture-scoped gradient pausing.
- **Dependencies**: Reuse existing `motion/react` (`useMotionValue`, `animate`, `PanInfo`); no new packages.
- **API / database / CMS / background jobs / storage**: No changes.
