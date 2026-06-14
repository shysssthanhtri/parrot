## Why

The landing page hero wavy background is visible on desktop near the hero image, but on mobile viewports the waves are not visible because the fixed vertical anchor (`waveYPosition`) places them below the fold or behind the mobile hero image. Mobile users miss the visual polish that reinforces the value proposition at the description ("Parrot helps you practice pronunciation and rhythm…").

## What Changes

- Adjust the hero wavy background vertical position on mobile so waves appear behind the description text area
- Keep the wavy canvas as the bottom background layer beneath all hero content (rings, headline, description, CTA, image)
- Preserve the current desktop wavy position near the hero image
- Use responsive positioning so mobile and desktop each anchor waves to the appropriate content region

## Capabilities

### New Capabilities

_None — this is a responsive layout fix for an existing landing hero effect._

### Modified Capabilities

- `learner-landing`: Extend the hero wavy background requirement to specify that waves SHALL be visible and anchored behind the description on mobile viewports, while remaining behind the hero image on desktop

## Impact

- **Components:** `src/components/hero115.tsx`, `src/components/ui/wavy-background.tsx`
- **Rendering:** Client-side canvas animation only; no change to static prerendering of `/`
- **CMS / APIs / jobs / storage:** No changes
