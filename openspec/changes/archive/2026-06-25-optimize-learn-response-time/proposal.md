## Why

Production `[learn-timing]` logs for `GET /learn` show warm requests at **213–319 ms** total, with **~70–90%** spent in thumbnail URL resolution (`thumbnails=187–505 ms`, dominated by cumulative `exists` HeadObject calls to R2). A cold first request spikes to **1504 ms** (`auth=905 ms`). Instrumentation from `optimize-learn-page-load` confirmed the bottleneck; this change applies targeted server-side fixes to cut R2 round-trips and redundant work on the `/learn` critical path.

## What Changes

- **Skip per-item R2 `HeadObject` (`objectExists`) in `speechPublications.list`** when a publication snapshot already has `thumbnailR2ObjectKey` (publish readiness guarantees the object existed at snapshot time).
- **Presign thumbnail URLs directly** from the snapshot key in `list`, eliminating the sequential exists-then-presign pattern.
- **Add a short-lived in-process presigned-URL cache** keyed by object key so repeated `/learn` loads within the same server instance avoid redundant signing work.
- **Keep timing instrumentation** enabled in prod (`ENABLE_LEARN_TIMING`) for before/after verification; no client or carousel changes.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `speech-publications`: Clarify that `speechPublications.list` resolves `thumbnailUrl` from snapshot `thumbnailR2ObjectKey` without a runtime storage existence check (publish snapshot is the source of truth).

## Impact

- **API**: `src/trpc/routers/speech-publications.ts` — faster `list` thumbnail resolution.
- **Storage**: New small presigned-URL cache helper in `src/lib/storage/` (or extend `r2.ts`).
- **Specs**: Delta under `openspec/changes/optimize-learn-response-time/specs/speech-publications/spec.md`.
- **Observability**: Existing `[learn-timing]` logs should show lower `thumbnails` / `exists` segments after deploy.
- **Risk**: If a thumbnail object is deleted outside normal publish/unpublish flows, list may return a presigned URL that 404s on fetch — same class of failure as today with stale signed URLs.
