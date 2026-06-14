## Context

`LearnerSpeechCatalog` (`src/app/(client)/learn/_components/learner-speech-catalog.tsx`) renders a single `LearnerSpeechCard` keyed by `activeIndex`. Navigation updates `focusedIndex` via keyboard listeners and chevron buttons; the card re-renders immediately with no enter/exit animation.

The card already wraps content in `BackgroundGradient`, which uses `motion/react`. The project has `motion` (Framer Motion v12) available without adding a new dependency.

## Goals / Non-Goals

**Goals:**

- Animate card enter/exit on index change with direction tied to navigation (next = up, previous = down).
- Keep one card visible in the layout; avoid scroll jank or layout shift during transition.
- Honor `prefers-reduced-motion` by skipping slide animation.
- Preserve existing behavior: clamp at ends, `aria-live` announcement, navigation hint collapse, loading/empty/error states unchanged.

**Non-Goals:**

- Crossfade-only carousel without directional movement.
- Swipe gestures, auto-advance, or staggered metadata animations.
- Animating the chevron buttons or position indicator (not present in current UI).
- Changes to `LearnerSpeechCard` internals or `BackgroundGradient` gradient animation.

## Decisions

### Track navigation direction in catalog state

Add `navigationDirection: 1 | -1 | 0` (or equivalent) updated inside `navigateSpeech` by comparing `nextIndex` to `currentIndex`. Pass direction into the transition wrapper so enter/exit variants use `y` offset sign consistently.

**Alternative:** Infer direction from React `useRef` of previous index inside the animation component — rejected; explicit state at the navigation source is clearer and testable.

### `AnimatePresence` + `motion.div` wrapper in catalog

Wrap the active card in `AnimatePresence` with `mode="popLayout"` (or `wait` if overlap is undesirable) and a `motion.div` keyed by `focusedSpeech.id` (fallback: `activeIndex`). Variants:

- **Next (`direction = 1`)**: enter `y: 48 → 0`, exit `y: 0 → -48`, optional `opacity` 0.6 → 1
- **Previous (`direction = -1`)**: enter `y: -48 → 0`, exit `y: 0 → 48`
- Duration ~250–300ms, `ease-in-out`

Container uses `overflow-hidden` and fixed min-height (or aspect-driven height from card) so sliding cards do not expand the page.

**Alternative:** CSS-only `transition-transform` on a single card — rejected; no clean exit animation without two-phase DOM or Motion.

**Alternative:** Reuse only Tailwind `transition` classes — rejected; enter/exit pairs need `AnimatePresence`.

### Reduced motion via `useReducedMotion`

Use `useReducedMotion()` from `motion/react`. When true, set `transition={{ duration: 0 }}` and zero `y` offsets (instant swap or opacity-only if any).

### No API or data changes

Transition is purely presentational; `speechPublications.list` and card props stay the same.

## Risks / Trade-offs

- **[Rapid key repeat stacks animations]** → `AnimatePresence` with `mode="wait"` or ignore navigation while `isAnimating` if needed; start with `popLayout` and tune if double-press feels laggy.
- **[Layout shift during slide]** → Parent `overflow-hidden` + stable width (`max-w-sm` column unchanged).
- **[Gradient motion + card motion]** → Card wrapper animates outer container; inner `BackgroundGradient` continues its ambient loop independently.

## Migration Plan

1. Implement transition wrapper in `learner-speech-catalog.tsx` (optional small `learner-speech-card-transition.tsx` if file grows).
2. Manual verify on `/learn` with multiple speeches: keyboard, buttons, first/last clamp, reduced motion in OS settings.
3. Rollback: revert UI component only; no data migration.

## Open Questions

None — directional slide with reduced-motion fallback is sufficient for v1.
