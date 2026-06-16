## Context

`LearnerSpeechSwipeStack` (`src/app/(client)/learn/_components/learner-speech-swipe-stack.tsx`) renders the active speech card as a `motion.div` with `drag="y"` bound to a `dragY` motion value, plus `prev`/`next` preview cards (`useTransform` of `dragY`) shown only while `isDragging`. The active card sits inside an `AnimatePresence mode="sync"` keyed by `speechKey`.

On `handleDragEnd`, when the threshold/velocity commits a direction, the code does:

```ts
dragY.set(0); // active card jumps back to center instantly
setIsTransitioning(true);
onNavigate(direction); // parent changes index → AnimatePresence enter/exit runs
```

This is the root of the remaining roughness:

1. **Reset-to-center jump** — the card the user dragged to (e.g. −220px) is forced to `0` in the same frame the index changes, before the enter/exit tween starts.
2. **Velocity discarded** — `dragMomentum={false}` and a fixed `SPEECH_CARD_TRANSITION = { duration: 0.5 }` tween; release speed has no effect on settle.
3. **Preview discontinuity** — previews are gated on `isDragging`, so the peeked card unmounts on release and a _different_ element (the new keyed active card) animates in from full offset.
4. **Two-stage motion** — drag (interactive) then a separate 0.5s enter/exit feels like two animations rather than one gesture.

`prefersReducedMotion` already routes to a non-interactive threshold path in `learner-speech-catalog.tsx`; that path is out of scope here. Desktop keyboard/chevron transitions use the catalog's own `AnimatePresence` and must remain unchanged.

## Goals / Non-Goals

**Goals:**

- Eliminate the reset-to-center jump: the released card's position flows directly into the settle animation.
- Carry release velocity into the settle motion (velocity-aware spring) so flicks feel fast and gentle drags feel soft.
- Keep the previewed adjacent card visually continuous through commit so the card the user dragged into view is the one that lands.
- Replace the fixed 0.5s mobile tween with responsive spring/short-duration motion; keep desktop timing untouched.
- Scope compositor hints to active drag/settle only; preserve gradient pause during the gesture.
- Preserve clamp/rubber-band, hint dismissal, position indicator, and reduced-motion behavior.

**Non-Goals:**

- Changing swipe semantics (up = next, down = previous) or thresholds beyond tuning.
- Horizontal swipe, pagination dots, or full virtualized list.
- New gesture/animation libraries (`@use-gesture/react`, Embla, etc.).
- Reworking the reduced-motion threshold path or desktop navigation.
- API, data, or persistence changes.

## Decisions

### Drive drag and settle with a single continuous translate, not reset + AnimatePresence

Replace the "drag inner card + `dragY.set(0)` + keyed enter/exit" composition with one continuous vertical offset that represents the whole windowed stack (previous / active / next). The drag updates that offset; on commit the offset animates from its _current released value_ to the resting position of the newly focused card; on cancel it animates back to the current card. There is no instant reset frame, so the gesture and settle are one motion.

Concretely: keep a `dragY` `useMotionValue`. Render prev/active/next as siblings positioned at `-(H+gap)`, `0`, `+(H+gap)` and translate all three by `dragY` together (the prev/next already use `useTransform(dragY, …)`; extend this so they participate through the settle, not only while dragging). On commit, instead of `dragY.set(0)` + index change, animate `dragY` toward `∓(H+gap)` (the slot of the target card) and only swap the focused index after that animation completes (or swap immediately while keeping the visual offset, then normalize `dragY` back to 0 in the same commit so the target card lands at slot 0 without a visible jump).

**Alternative — keep AnimatePresence enter/exit but seed the exit variant with the drag offset:** rejected. Handing the live `dragY` into a variant-based exit is fiddly with `mode="sync"` and still splits drag vs. transition into two owners; the single-offset model is simpler and inherently jump-free.

**Alternative — full carousel/virtualized track of all N cards:** rejected as over-scoped; a 3-card window (prev/active/next) is enough for single-card Shorts UX and keeps DOM small.

### Velocity-aware settle via Motion `animate(dragY, target, spring)`

On `handleDragEnd`, use `info.velocity.y` to seed the settle. Use a spring (`type: "spring"`) with a `velocity` option (or Motion's inertia/`animate` velocity passthrough) so a fast flick covers the remaining distance quickly and a slow release eases in. Keep the existing distance (`SWIPE_THRESHOLD_PX = 50`) and velocity (`SWIPE_VELOCITY_THRESHOLD = 500`) commit decision logic; only the _settle motion_ becomes velocity-driven.

**Alternative — keep `duration: 0.5` tween, just shorten to ~0.3s:** partial improvement but still ignores release speed; a spring with velocity handoff is the change users will actually feel.

### Keep previews mounted through the settle, not only during `isDragging`

Gate preview rendering on `isDragging || isTransitioning` (and direction allowed) rather than `isDragging` alone, so the peeked adjacent card stays on screen as the offset animates to its slot. After the index commit, normalize so the landed card becomes the active slot. This removes the "fresh card slides in" discontinuity.

**Alternative — preload but hide previews:** rejected; the visible continuity of the dragged-into card is the point.

### Compositor hints scoped to interaction

Apply `will-change: transform` / GPU layer promotion only while `isDragging || isTransitioning`, dropping it at rest, to avoid permanently retained layers on low-end devices. Continue passing `gradientAnimate={false}` to the card's `BackgroundGradient` during the gesture (existing `gradientAnimate = !isDragging && !isTransitioning`).

**Alternative — always-on `will-change-transform` (current):** rejected; permanent hints increase memory/compositor pressure for no benefit at rest.

### Boundary behavior unchanged in semantics

At first/last speech, keep rubber-band resistance (current `dragElastic` ~0.15/0.25 feel) so no non-existent preview shows and the card springs back. Commit remains blocked by `canGoUp` / `canGoDown`.

## Risks / Trade-offs

- **Index swap vs. visual offset race** → If the focused index commits before the settle finishes, the keyed DOM can reshuffle mid-animation. Mitigation: drive the settle on `dragY` first and normalize/swap atomically (swap index + set `dragY` back to 0 to the target's resting slot in one commit), or defer the index swap to settle completion; verify no flash in QA.
- **Rapid consecutive flicks** → Allow interrupting an in-flight settle by reading current `dragY` as the new gesture's start; guard against skipping past clamp at ends (already enforced by `canGoUp`/`canGoDown`).
- **`containerHeight` not yet measured** → Preview/slot offsets depend on `ResizeObserver` height; if `0` on first paint the first drag could mis-position. Mitigation: fall back to `0` offset until measured (matches today) and recompute on resize.
- **Spring overshoot on tall cards** → Tune stiffness/damping so the portrait card does not visibly bounce past its slot; cap with reasonable damping.
- **Desktop regression** → Changes are inside the mobile-only `LearnerSpeechSwipeStack` path (`useInteractiveMobileSwipe`); desktop and reduced-motion paths in `learner-speech-catalog.tsx` stay as-is.

## Migration Plan

1. Refactor commit/settle in `learner-speech-swipe-stack.tsx` to the continuous single-offset model with velocity handoff; keep prev/active/next preview structure.
2. Extend preview mount condition to cover the settle, and scope compositor hints to drag/settle.
3. Tune spring (stiffness/damping/velocity) and confirm boundary rubber-band and clamp.
4. Manual QA at mobile widths on `/learn`: slow drag commit, fast flick, cancel below threshold, first/last rubber-band, rapid consecutive swipes, reduced-motion fallback, desktop regression.
5. Rollback: revert the swipe-stack component; no data or API migration.

## Open Questions

None blocking. Whether to swap the focused index on settle completion vs. atomically with an offset normalization is an implementation detail to settle during QA based on which avoids any visible flash.
