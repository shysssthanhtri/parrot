## Why

The learner speech catalog loads thumbnail images only when a speech card becomes visible. During navigation transitions, the incoming card often shows an empty cover until the image finishes downloading, which makes browsing feel sluggish and undermines the Shorts-style flow we recently added.

## What Changes

- Prefetch thumbnail images for the next two speeches ahead of the currently focused speech in the catalog.
- Re-run prefetch when the focused index changes so the lookahead window stays aligned with navigation.
- Skip prefetch for speeches without a `thumbnailUrl` (no cover image).
- No change to which speeches are fetched from the API — `speechPublications.list` already returns all publication metadata and URLs; this change only warms the browser image cache earlier.

## Capabilities

### New Capabilities

<!-- None — prefetch behavior extends the existing learner catalog -->

### Modified Capabilities

- `learner-space`: Add requirements for proactive thumbnail image prefetch during catalog browse.

## Impact

- **Learner UI**: `src/app/(client)/learn/_components/learner-speech-catalog.tsx` (primary); optional small prefetch helper/hook colocated under `learn/_components` or `learn/_hooks`.
- **API / database / CMS**: No changes — thumbnail URLs already come from `speechPublications.list`.
- **Dependencies**: No new packages; use native browser image prefetch (`Image` constructor or `<link rel="preload">`).
