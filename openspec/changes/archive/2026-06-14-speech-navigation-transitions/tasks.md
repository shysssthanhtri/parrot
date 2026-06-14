## 1. Navigation direction state

- [x] 1.1 Add `navigationDirection` state (`1 | -1 | 0`) to `LearnerSpeechCatalog` and set it inside `navigateSpeech` from the index delta

## 2. Card transition animation

- [x] 2.1 Wrap the active `LearnerSpeechCard` in `AnimatePresence` + `motion.div` keyed by speech id, with directional enter/exit variants driven by `navigationDirection`
- [x] 2.2 Add `overflow-hidden` on the card column container to prevent slide overflow during animation
- [x] 2.3 Use `useReducedMotion()` from `motion/react` to disable slide offsets when reduced motion is preferred

## 3. Verification

- [x] 3.1 Run lint and typecheck for touched files
