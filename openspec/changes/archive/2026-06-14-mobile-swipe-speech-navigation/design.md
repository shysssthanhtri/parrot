## Context

`LearnerSpeechCatalog` (`src/app/(client)/learn/_components/learner-speech-catalog.tsx`) renders a vertical Shorts-style speech catalog. Desktop users navigate with keyboard (↑ / ↓) and on-screen chevron buttons. A hint ("Use ↑ ↓ to browse speeches") appears beside the chevrons and collapses after the first navigation via `hasNavigated` state.

On mobile viewports (< 768px, matching `useIsMobile` in `src/hooks/use-mobile.ts`), the three-column grid places chevrons to the right of the card — awkward for thumb reach and inconsistent with vertical swipe conventions (TikTok/YouTube Shorts).

## Goals / Non-Goals

**Goals:**

- Enable vertical swipe on the card area for mobile: swipe up → next speech, swipe down → previous speech.
- Hide chevron buttons on mobile; keep keyboard and chevrons on desktop.
- Show mobile-specific hint copy; keep desktop hint unchanged.
- Dismiss hint after first successful navigation on any input method (existing `hasNavigated` behavior).
- Reuse existing `navigateSpeech`, transition animation, and clamp-at-ends logic.
- Honor `prefers-reduced-motion` (swipe still navigates; animation behavior unchanged).

**Non-Goals:**

- Horizontal swipe, pull-to-refresh, or drag-to-follow (rubber-band preview) during swipe.
- Replacing keyboard navigation on mobile (arrow keys may still work on mobile keyboards).
- Persisting hint-dismissed state across sessions (localStorage).
- Adding a new swipe library dependency.

## Decisions

### Use `useIsMobile` for layout and interaction branching

Import `useIsMobile` from `@/hooks/use-mobile` (768px breakpoint, already used by sidebar). Conditionally render chevrons and hint copy; attach swipe handlers only when `isMobile`.

**Alternative:** CSS-only `hidden md:flex` for chevrons without JS — still need JS for swipe and hint text, so `useIsMobile` is used for behavior and can pair with responsive classes for layout.

### Pointer-based swipe on card container

Attach `onPointerDown`, `onPointerMove`, and `onPointerUp` (or `onPointerCancel`) to the card column wrapper. Track `startY` and compute `deltaY` on release:

- `deltaY < -SWIPE_THRESHOLD` (e.g. 50px) → `navigateSpeech(1)` (swipe up = next)
- `deltaY > SWIPE_THRESHOLD` → `navigateSpeech(-1)` (swipe down = previous)
- Ignore swipes below threshold to avoid accidental navigation on taps.

Use `touch-action: pan-y` or `touch-none` on the swipe target as needed to reduce conflict with page scroll; the catalog is vertically centered with limited scroll, so brief vertical swipes on the card are the primary gesture.

**Alternative:** `motion/react` `drag="y"` with `onDragEnd` — possible but adds drag feedback complexity; simple threshold on pointer events is sufficient for v1.

**Alternative:** Third-party `use-gesture` — rejected; no new dependency for a single vertical swipe.

### Mobile layout without chevron column

On mobile, simplify the grid: single centered card column (full width `max-w-sm`). Hint renders below or above the card (not beside chevrons). Desktop keeps the existing `grid-cols-[1fr_minmax(0,24rem)_1fr]` with chevrons in the right column.

### Hint copy and dismissal

- Desktop: "Use ↑ ↓ to browse speeches" (unchanged).
- Mobile: "Swipe up or down to browse speeches".
- Dismissal: existing `hasNavigated` reducer flag + collapse animation — no change to dismissal logic; swipe navigation calls the same `navigateSpeech` which sets `hasNavigated: true`.

### No API or data changes

Swipe is presentational; `speechPublications.list` and navigation reducer stay the same.

## Risks / Trade-offs

- **[Swipe vs page scroll]** → Attach handlers to the card container only; use a minimum distance threshold; avoid `preventDefault` unless necessary.
- **[False positives on tap]** → Require threshold (50px); do not navigate on pointer up without sufficient vertical movement.
- **[SSR hydration flash]** → `useIsMobile` starts `undefined` then resolves; chevrons may briefly show before hide. Acceptable for v1; optional `hidden md:flex` on chevron container reduces flash.
- **[Rapid swipes during animation]** → Same as keyboard repeat; existing `AnimatePresence` handles concurrent navigation; clamp at ends prevents over-navigation.

## Migration Plan

1. Update `learner-speech-catalog.tsx`: mobile layout, swipe handlers, conditional hint/chevrons.
2. Manual verify on `/learn` at mobile and desktop widths: swipe directions, hint text, hint dismissal, chevron visibility, first/last clamp, reduced motion.
3. Rollback: revert UI component only; no data migration.

## Open Questions

None — vertical swipe with threshold and platform-specific hint is sufficient for v1.
