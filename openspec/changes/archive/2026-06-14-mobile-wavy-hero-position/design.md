## Context

The landing page hero (`Hero115` in `src/components/hero115.tsx`) wraps all hero content in `WavyBackground` (`src/components/ui/wavy-background.tsx`). The wavy canvas draws animated waves anchored at a configurable vertical fraction of the container height via `waveYPosition` (currently `0.58`).

On desktop, the hero layout places text content above a wide hero image; anchoring waves at ~58% positions them behind the image area as intended. On mobile, the layout stacks icon → headline → description → CTA → mobile image. The same `0.58` anchor places waves too low—behind or below the mobile image—so the effect is not visible when users read the description.

The `WavyBackground` component already accepts `waveYPosition` as a prop and uses it in canvas drawing. The fix is to supply a responsive anchor value from `Hero115` without changing the stacking order (canvas remains `-z-20`, content remains above).

## Goals / Non-Goals

**Goals:**

- Make the wavy background visible on mobile viewports, anchored behind the hero description text
- Keep the wavy canvas as the bottom background layer under all hero elements (rings, text, CTA, image)
- Preserve the current desktop wavy position near the hero image
- Avoid layout shifts or changes to hero copy, CTA, or image assets

**Non-Goals:**

- Repositioning waves on auth pages, CMS, or learner space
- Replacing the wavy background with a different effect
- Element-level dynamic measurement (ResizeObserver on description) unless a fixed breakpoint anchor proves insufficient
- SEO, metadata, or static rendering changes

## Decisions

### 1. Responsive `waveYPosition` via viewport media query in `Hero115`

**Decision:** Use a `matchMedia('(min-width: 768px)')` listener (or an existing hook if one exists) in `Hero115` to pass two anchor values to `WavyBackground`:

- **Mobile (`< md`):** ~`0.38`–`0.42` — positions waves behind the description paragraph
- **Desktop (`≥ md`):** `0.58` — keeps current behavior behind the hero image

**Rationale:** `WavyBackground` already supports `waveYPosition`. A breakpoint-based value is minimal, predictable, and matches the hero's existing responsive layout (mobile image shown only below `md`). No new component API is required unless tuning demands it.

**Alternatives considered:**

- **Single fixed value for all viewports** — does not fix mobile visibility
- **Measure description element position with ResizeObserver** — more accurate but adds complexity and re-draw churn; defer unless breakpoint values fail visual review
- **Separate mobile/desktop `WavyBackground` instances** — duplicates canvas animation and wastes resources

### 2. Re-render canvas when `waveYPosition` changes

**Decision:** Rely on the existing `waveYPositionRef` sync in `WavyBackground`'s `useEffect` dependency array. When the responsive value changes (e.g., on resize across the `md` breakpoint), the ref updates and subsequent animation frames use the new anchor.

**Rationale:** The component already tracks `waveYPosition` in a ref updated on prop change. No structural change to the animation loop is needed.

**Alternatives considered:**

- **Restart animation loop on breakpoint change** — unnecessary; ref update is sufficient

### 3. Keep z-index and layer order unchanged

**Decision:** Do not change stacking. Canvas stays at `-z-20`, concentric rings at `-z-10`, hero content at default/`z-10`.

**Rationale:** User explicitly requires waves to remain in the background under all elements. The mobile issue is vertical anchor placement, not stacking.

### 4. Tune mobile anchor during implementation

**Decision:** Start with `waveYPosition={0.4}` for mobile and `0.58` for desktop; adjust after visual review in light/dark themes.

**Rationale:** Exact fraction depends on hero padding (`py-32`), icon/heading height, and mobile image presence. A small tuning range is acceptable within implementation.

## Risks / Trade-offs

- **[Breakpoint anchor imprecise on very small/tall viewports]** → Tune `0.38`–`0.42` range during visual QA; fall back to element measurement only if needed
- **[Resize across breakpoint causes brief wave reposition]** → Acceptable; waves re-anchor smoothly on next frame
- **[Canvas performance unchanged]** → No new animation cost; same single canvas instance

## Migration Plan

1. Add responsive `waveYPosition` logic in `Hero115`
2. Verify `/` on mobile and desktop in light/dark mode
3. No database, env, or deployment config changes

**Rollback:** Revert `Hero115` to a single `waveYPosition={0.58}`.

## Open Questions

- None blocking — mobile anchor fraction finalized during visual review.
