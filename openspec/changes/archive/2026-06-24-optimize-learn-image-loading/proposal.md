## Why

The `/learn` page now renders every speech card in a vertical carousel, and each `SpeechCard` mounts a Next.js `Image` with `priority`, so the browser requests all publication thumbnails on first paint. That wastes bandwidth and slows initial load when many speeches are published, especially on mobile.

## What Changes

- Load thumbnail images only within a sliding window of three speeches: the focused speech and the next two (`index`, `index + 1`, `index + 2`).
- On initial catalog load with the first speech focused, load thumbnails for speeches 1–3 (indices 0, 1, 2).
- When the focused index changes, extend the window to cover the new focused speech plus the next two; skip speeches without a `thumbnailUrl`.
- Remove unconditional `priority` from every card image; apply priority only to the initially visible thumbnail.
- Render placeholder cover UI for speeches outside the load window instead of mounting `<Image>` for every carousel item.
- No change to the `speechPublications.list` API — metadata for all speeches still loads in one request.

## Capabilities

### New Capabilities

<!-- None — windowed thumbnail loading extends the existing learner catalog -->

### Modified Capabilities

- `learner-space`: Replace the prefetch-only thumbnail requirement with windowed thumbnail loading that limits active image requests to the focused speech and the next two.

## Impact

- **Learner UI**: `src/app/(client)/learn/_components/speech-carousel.tsx`, `speech-card.tsx` (primary); optional small helper/hook colocated under `learn/_components` or `learn/_hooks`.
- **API / database / CMS**: No changes — thumbnail URLs already come from `speechPublications.list`.
- **Dependencies**: No new packages; reuse existing Next.js `Image` and native prefetch patterns where helpful.
