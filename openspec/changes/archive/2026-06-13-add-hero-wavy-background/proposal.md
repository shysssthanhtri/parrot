## Why

The marketing landing hero ("Learn languages by shadowing native speakers") currently uses a minimal concentric-circle decoration behind the headline. That background feels flat compared to the rest of the product polish and does little to draw attention to the primary value proposition. Adding Aceternity UI's animated wavy canvas background beneath the existing circle rings will give the hero more visual depth while preserving the current layout, rings, and copy.

## What Changes

- Install the Aceternity `wavy-background` component via the existing `@aceternity` shadcn registry
- Add the animated wavy background as the bottom layer in `Hero115`, beneath the concentric-circle rings and all hero content
- Keep the existing concentric-circle ring decoration unchanged above the waves
- Tune wave colors, opacity, and background fill to match Parrot's light/dark theme tokens
- Preserve existing hero content (headline, description, CTA, hero image) and landing page static rendering

## Capabilities

### New Capabilities

_None — this is a visual enhancement to an existing landing surface._

### Modified Capabilities

- `learner-landing`: Extend the landing page hero requirement to include an animated wavy background effect beneath the existing circle rings and hero content

## Impact

- **Components:** `src/components/hero115.tsx`; new `src/components/ui/wavy-background.tsx` (from Aceternity registry)
- **Registry:** Uses existing `@aceternity` entry in `components.json`; no new registry configuration
- **Dependencies:** May add `simplex-noise` (or similar) as a transitive dependency of the Aceternity component — verify after install
- **Rendering:** Wavy background is a client-side canvas animation; landing page remains statically prerendered with client hydration for the effect
- **CMS / APIs / jobs / storage:** No changes
