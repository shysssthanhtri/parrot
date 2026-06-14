## Context

`LearnerSpeechCatalog` (`src/app/(client)/learn/_components/learner-speech-catalog.tsx`) implements mobile swipe via raw pointer events: track `startY` / `currentY`, and on pointer up compare `deltaY` to a 50px threshold before calling `navigateSpeech`. The card does not move during the gesture.

After navigation, `AnimatePresence` with `mode="sync"` animates enter/exit cards over 0.5s using `y: ±100%` offsets. The card wraps in `BackgroundGradient`, which runs continuous gradient position animations with `will-change-transform`.

The prior `mobile-swipe-speech-navigation` change explicitly scoped out drag-to-follow as a non-goal. User feedback now indicates swipe **functionality** is correct but **motion quality** needs improvement.

## Goals / Non-Goals

**Goals:**

- Make mobile swipe feel connected to the user's finger: card follows vertical drag in real time.
- Show a peek of the adjacent speech card during drag when navigation in that direction is allowed.
- Spring or snap back smoothly when the swipe is cancelled (below threshold or at list boundary).
- Keep completed swipe transitions snappy on mobile (target ~250–350ms or equivalent spring) while preserving desktop keyboard/chevron timing.
- Maintain existing clamp rules, hint behavior, reduced-motion handling, and navigation semantics.
- Reduce perceived jank via transform-only motion and compositor hints.

**Non-Goals:**

- Horizontal swipe, pull-to-refresh, or pagination dots.
- Changing swipe direction semantics (up = next, down = previous).
- New gesture libraries (`@use-gesture/react`, Hammer.js, etc.).
- Persisting drag state across sessions or changing API/data layer.
- Reworking desktop transition behavior unless shared tuning clearly benefits both platforms.

## Decisions

### Replace threshold-only pointer tracking with Motion drag on mobile

Use `motion/react` `drag="y"` (or `useMotionValue` + pointer handlers if drag constraints need custom clamping) on the active card container when `isMobile && !prefersReducedMotion`. Bind `style={{ y }}` so the card tracks the finger during the gesture.

On `onDragEnd`, evaluate:

- **Distance**: existing 50px threshold (tunable).
- **Velocity**: optional fast-flick override (e.g. `velocity.y < -500` commits to next even below distance threshold).

Commit navigation when threshold/velocity passes and direction is allowed; otherwise animate `y` back to `0` with a short spring.

**Alternative:** Keep raw pointer events and manually set `transform: translateY()` — rejected; Motion drag integrates velocity, spring snap-back, and pointer capture cleanly.

**Alternative:** Full carousel with Embla — rejected; over-scoped for vertical Shorts-style single-card UX.

### Stack preview card during drag

While dragging on mobile, render the adjacent speech (next when dragging up, previous when dragging down) in a sibling `motion.div` positioned behind or offset from the active card. Offset the preview by `containerHeight + dragY` (or inverse) so it slides into view as the user drags.

Clamp drag offset at first/last speech: apply rubber-band resistance (e.g. `dragElastic={0.2}` or manual dampening) instead of showing a non-existent card.

**Alternative:** Only move the active card with empty space behind — rejected; adjacent preview is key to Shorts-style continuity.

### Separate mobile vs desktop transition config

Keep `AnimatePresence` enter/exit for index changes. For mobile completed swipes:

- Reduce travel from `100%` to card-height-relative offset or a tuned pixel/spring target so motion feels less heavy.
- Use spring transition (`type: "spring", stiffness ~300–400, damping ~30–35`) or shorter duration (~0.3s) with existing cubic-bezier.

Desktop keyboard/chevron navigation can retain current duration/easing unless a shared constant simplifies maintenance.

**Alternative:** Single 0.5s transition everywhere — rejected; mobile post-drag animation feels sluggish after interactive drag.

### Pause ambient gradient during drag/transition on mobile

Pass `animate={false}` to `BackgroundGradient` (existing prop) while `isDragging || isTransitioning` on mobile. Resumes after snap-back or navigation animation completes.

**Alternative:** Always animate gradient — rejected; dual transform animations on nested layers can cause compositor contention on low-end phones.

### GPU and layout stability

- Keep the invisible sizing ghost card for stable container height.
- Add `will-change-transform` and `transform-gpu` (or equivalent) on drag and transition layers.
- Parent container keeps `overflow-hidden` and `touch-none` during mobile swipe target interaction.

### Reduced motion unchanged semantically

When `prefers-reduced-motion` is enabled: skip drag-follow and preview; keep instant threshold-based navigation (current behavior). No spring animations.

## Risks / Trade-offs

- **[Drag vs tap on card links]** → Card is not currently clickable; swipe target is the card container only. Monitor if future interactive elements are added inside the card.
- **[Double animation on commit]** → Drag ends with card offset, then `AnimatePresence` runs enter/exit. Reset drag `y` to 0 immediately on commit before index change, or hand off offset to exit variant to avoid a visible jump. Tune in implementation.
- **[Rapid consecutive swipes]** → Ignore new drag while `isTransitioning` or debounce navigation until exit completes; clamp at ends already limits over-navigation.
- **[Preview card image load]** → Adjacent speech thumbnails are prefetched (existing requirement); preview uses same `LearnerSpeechCard` with prefetched URLs.
- **[SSR / hydration]** → Drag handlers attach only client-side when `isMobile` resolves; no SSR change.

## Migration Plan

1. Refactor mobile swipe block in `learner-speech-catalog.tsx` (optional extract `learner-speech-swipe-stack.tsx` if file grows).
2. Add `animate` toggle wiring to `BackgroundGradient` during drag/transition.
3. Manual QA on `/learn` at mobile widths: slow drag, fast flick, cancel below threshold, first/last rubber-band, reduced motion, desktop regression.
4. Rollback: revert UI components only; no data migration.

## Open Questions

None — interactive drag-follow with snap-back and tuned mobile transitions is sufficient for v1. Velocity threshold values to be tuned during implementation QA.
