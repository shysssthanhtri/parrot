## 1. Mobile drag-follow stack

- [x] 1.1 Replace raw pointer threshold handlers in `learner-speech-catalog.tsx` with Motion `drag="y"` (or `useMotionValue`) on mobile when reduced motion is off
- [x] 1.2 Render adjacent speech preview card during drag when navigation in that direction is allowed; clamp with rubber-band at first/last speech
- [x] 1.3 Implement snap-back spring on release when swipe is below threshold or blocked at boundary
- [x] 1.4 Commit navigation on threshold or velocity flick; reset drag offset before handoff to enter/exit animation

## 2. Transition tuning and performance

- [x] 2.1 Add mobile-specific transition config (shorter duration or spring) for completed swipe navigation; keep desktop keyboard/chevron config unchanged
- [x] 2.2 Pass `animate={false}` to `BackgroundGradient` during mobile drag and transition to reduce compositor contention
- [x] 2.3 Add transform compositor hints (`will-change-transform` / GPU layer) on drag and transition wrappers

## 3. Reduced motion and regression guard

- [x] 3.1 Preserve threshold-only instant navigation path when `prefers-reduced-motion` is enabled (no drag-follow or preview)
- [x] 3.2 Run lint and typecheck for touched files
