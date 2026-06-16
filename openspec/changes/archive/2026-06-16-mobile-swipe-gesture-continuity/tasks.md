## 1. Continuous gesture commit

- [x] 1.1 In `learner-speech-swipe-stack.tsx`, remove the instant `dragY.set(0)` reset on committed swipe in `handleDragEnd` so the released card no longer snaps to center before transitioning.
- [x] 1.2 Drive the committed swipe by animating `dragY` from its released value toward the target card's resting slot (`∓(containerHeight + SPEECH_CARD_STACK_GAP_PX)`) instead of handing off to a fresh keyed `AnimatePresence` enter/exit.
- [x] 1.3 Swap the focused index atomically with the offset normalization (swap index and reset `dragY` to the target's slot in the same commit, or defer the index swap to settle completion) so the landed card becomes the active slot without a visible flash.

## 2. Velocity-aware settle

- [x] 2.1 Replace the fixed `SPEECH_CARD_TRANSITION` ({ duration: 0.5 }) used for committed mobile swipes with a velocity-aware spring via `animate(dragY, target, …)`, seeding `velocity` from `info.velocity.y` in `handleDragEnd`.
- [x] 2.2 Keep the existing commit decision logic (`SWIPE_THRESHOLD_PX`, `SWIPE_VELOCITY_THRESHOLD`, `canGoUp`/`canGoDown`); tune spring `stiffness`/`damping` so the portrait card settles without visible overshoot.
- [x] 2.3 Keep the snap-back path (`animate(dragY, 0, SNAP_BACK_SPRING)`) for below-threshold releases and boundary rubber-band.

## 3. Continuous preview and compositor hints

- [x] 3.1 Gate `showPrevPreview` / `showNextPreview` on `isDragging || isTransitioning` (and direction allowed) so the previewed adjacent card stays mounted through the settle instead of unmounting on release.
- [x] 3.2 Ensure prev/next preview `useTransform(dragY, …)` offsets remain bound through the settle animation so the previewed card tracks the same motion value as the active card.
- [x] 3.3 Scope `will-change: transform` / GPU promotion on the drag and settle layers to `isDragging || isTransitioning` only, dropping it at rest; keep `gradientAnimate={false}` during the gesture.

## 4. Boundary, reduced motion, and regression

- [x] 4.1 Verify rubber-band/clamp at first and last speech still blocks commit and shows no non-existent preview.
- [x] 4.2 Confirm the reduced-motion threshold path in `learner-speech-catalog.tsx` and desktop keyboard/chevron transitions are unchanged.
- [x] 4.3 Handle interrupted/rapid consecutive swipes by reading current `dragY` as the next gesture's start without skipping clamp at ends.

## 5. Verification

- [x] 5.1 Run lint on touched files.
- [x] 5.2 Run type checking.
- [x] 5.3 Run the production build.
