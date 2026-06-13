## Context

The public landing page at `/` renders `Hero115` (`src/components/hero115.tsx`) with the headline "Learn languages by shadowing native speakers." The hero currently uses a static concentric-circle border decoration (`aria-hidden` absolute div) as its only background treatment. The project already registers the Aceternity UI shadcn registry in `components.json` and uses other Aceternity components (e.g. `hover-border-gradient`).

The [Aceternity Wavy Background](https://ui.aceternity.com/components/wavy-background) component renders an animated canvas wave effect. It is a client component (`"use client"`) because it uses `requestAnimationFrame` and canvas drawing.

## Goals / Non-Goals

**Goals:**

- Add the Aceternity wavy background as the bottom layer behind all hero content
- Keep the existing concentric-circle ring decoration above the waves
- Match wave colors and background fill to Parrot's neutral theme in light and dark mode
- Keep hero layout, copy, CTA, and hero image unchanged
- Preserve static prerendering of `/` (`force-static`)

**Non-Goals:**

- Adding wavy backgrounds to auth pages, CMS, or learner space
- Custom wave physics or a from-scratch canvas implementation
- Changing hero copy, CTA destination, or hero image assets
- SEO or metadata changes

## Decisions

### 1. Install via existing Aceternity shadcn registry

**Decision:** Run `pnpm dlx shadcn@latest add @aceternity/wavy-background` to add `src/components/ui/wavy-background.tsx`.

**Rationale:** The registry is already configured in `components.json`. This matches how `hover-border-gradient` was added and keeps the component updatable via the CLI.

**Alternatives considered:**

- Copy-paste source manually — harder to diff against upstream updates
- Build a custom canvas effect — unnecessary scope for a decorative background

### 2. Layer wavy background under everything in `Hero115`

**Decision:** Wrap the full hero content block (rings, text, CTA, and image) in `WavyBackground` within `Hero115`. Keep the concentric-circle rings; position the wavy canvas at the lowest z-index so rings and content sit above it.

**Rationale:** The user wants both effects — waves for depth, rings for structure. Layering inside `Hero115` keeps the marketing page unchanged and preserves the existing ring markup.

**Layer order (bottom → top):**

1. Wavy canvas (`-z-20` or equivalent)
2. Concentric-circle rings (existing `-z-10`)
3. Hero content — icon, headline, CTA, image (default stacking)

**Alternatives considered:**

- Replace rings with waves only — rejected; user wants both
- Wrap at page level — couples landing-specific layout to the page file

### 3. Client boundary at `Hero115`

**Decision:** Add `"use client"` to `Hero115` (or extract a small `Hero115WavyShell` client wrapper if preferred to minimize client surface).

**Rationale:** `WavyBackground` requires client-side canvas animation. `Hero115` already uses interactive UI (`HoverBorderGradient`). Marking the hero as a client component does not affect static HTML prerendering of the page shell.

**Alternatives considered:**

- Split into server `Hero115` + client `Hero115Background` wrapper — slightly more files; acceptable if we want to keep most of the hero server-rendered, but the full hero block is small enough to colocate

### 4. Theme-aware wave styling

**Decision:** Pass `backgroundFill` and `colors` props tuned for light/dark using CSS variables or theme-aware values. Use moderate `waveOpacity` (~0.4–0.5) and `blur` (~10) per Aceternity defaults; set `speed="slow"` for a calmer marketing feel.

**Rationale:** Default Aceternity colors (`#38bdf8`, `#818cf8`, etc.) work on dark backgrounds but need adjustment for light mode. Parrot uses neutral theme tokens — background fill should map to `background` / near-black for dark.

**Alternatives considered:**

- Single color set for both themes — poor contrast in one mode
- `next-themes` hook inside wavy component — only needed if props cannot be set statically; prefer CSS-variable-based fills where the component supports them

### 5. Layout and z-index

**Decision:** Use `WavyBackground` as the outer wrapper for the entire hero section content area. Set `containerClassName` to span the full hero height (text + image). Place the canvas at the bottom of the stack; keep circle rings at `-z-10` relative to content; ensure headline, CTA, rings, and hero image all render above the waves.

**Rationale:** Waves provide ambient motion under everything; rings remain the focal structural element over the animation.

## Risks / Trade-offs

- **[Client JS required for animation]** → Hero still renders all text/CTA without JS; waves are decorative (`aria-hidden` on canvas). Acceptable progressive enhancement.
- **[Canvas performance on low-end mobile]** → Use `speed="slow"` and default wave count; monitor if jank reported; can reduce `waveOpacity` or disable on `prefers-reduced-motion` as a follow-up.
- **[New dependency via Aceternity component]** → Accept transitive deps from registry install; verify lockfile after add.
- **[Light mode contrast]** → Test both themes manually; adjust `colors` and `backgroundFill` before merge.

## Migration Plan

1. Install `@aceternity/wavy-background` via shadcn CLI
2. Update `Hero115` to wrap content in `WavyBackground` while keeping circle rings
3. Verify `/` in light and dark mode locally
4. No database, env, or deployment config changes; ship with normal frontend deploy

**Rollback:** Revert `Hero115` and remove `wavy-background.tsx` if the effect is undesirable.

## Open Questions

- None blocking — color palette can be finalized during implementation with visual review in both themes.
