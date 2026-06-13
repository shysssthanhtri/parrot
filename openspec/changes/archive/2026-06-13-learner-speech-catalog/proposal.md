## Why

Published speeches, thumbnails, and learner list APIs exist, but `/learn` still shows a "coming soon" placeholder. Learners need a first browse experience to discover shadowing content before playback ships. A vertical Shorts-style card carousel on a single page matches how learners will eventually consume speeches and unblocks the learner product surface.

## What Changes

- Replace the `/learn` coming-soon empty state with a browse-only catalog of published speeches.
- Display one portrait card at a time (Shorts-style): thumbnail, title, script length label, language, and voice name.
- Support ↑ / ↓ keyboard navigation between speeches with a position indicator (e.g. 2 / 5).
- Freeze script `length` (`short`, `medium`, `long`) in the publication snapshot at publish time and expose it on `speechPublications.list`.
- Show a real empty state when no speeches are published.
- **Out of scope:** Start button, audio playback, player overlay, language/topic filters, mobile swipe, separate player route.

## Capabilities

### New Capabilities

<!-- None — catalog UI extends existing learner-space and speech-publications specs -->

### Modified Capabilities

- `learner-space`: Replace v1 welcome-only / coming-soon requirement with a published-speech catalog carousel on `/learn`; keyboard navigation; no player in this change.
- `speech-publications`: Snapshot includes frozen `length`; learner list returns `length` for each published item.

## Impact

- **Database**: Prisma migration adding `length` to `SpeechPublication`.
- **API**: `buildPublicationSnapshot` and `speechPublications.list` include `length`; republish overwrites snapshot `length`.
- **Learner UI**: New client components under `src/app/learn/`; update `src/app/learn/page.tsx`.
- **CMS / jobs / storage**: No changes.
