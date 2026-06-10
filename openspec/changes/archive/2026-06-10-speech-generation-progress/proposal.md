## Why

Async speech generation already tracks per-chunk progress in the database (`totalChunks`, `settledChunks`), but the CMS detail page shows only a generic "Generating audio" message with no indication of how far along synthesis is. For long scripts that can take many minutes, users cannot tell whether generation is progressing or stalled.

## What Changes

- Replace the generic generating card on the speech detail page with a progress indicator driven by `settledChunks` and `totalChunks`.
- Show a percentage (and chunk count, e.g. "3 of 12") while chunks are synthesizing; handle the pre-chunk `pending` phase and post-chunk finalize phase with appropriate messaging.
- Ensure `speeches.getById` explicitly exposes chunk progress fields to the CMS client (already stored on `Speech`; spec and UI will consume them).
- Optionally surface progress on the speeches list status column for in-flight rows (percentage or chunk fraction when available).

## Capabilities

### New Capabilities

_None — this change extends existing speech generation UX using fields already persisted by async TTS jobs._

### Modified Capabilities

- `cms-speeches`: Generating state on detail page (and optionally list) shows chunk-based progress instead of a static label.
- `speeches`: `speeches.getById` response SHALL include `totalChunks` and `settledChunks` while a speech is in progress so the CMS can compute progress.

## Impact

- **API**: `src/trpc/routers/speeches.ts` — confirm `getById` returns `totalChunks` and `settledChunks` (likely already via Prisma spread); no new endpoints.
- **UI**: `speech-detail.tsx`, possibly `speech-process-status-badge.tsx` or list table; new small helper for progress calculation in `src/lib/`.
- **Database / queues**: No schema or job changes; reuses existing chunk counters updated by `speech-tts-start` and `speech-tts-chunk` consumers.
