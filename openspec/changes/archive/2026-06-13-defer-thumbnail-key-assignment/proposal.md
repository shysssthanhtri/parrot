## Why

The thumbnail queue worker fails with `Speech has no thumbnail key` when `thumbnailR2ObjectKey` is null. Speeches created before the thumbnail migration were never backfilled, and the current design pre-assigns the key at `speeches.create` even though no object exists yet. Assigning the storage key when thumbnail processing actually starts aligns the database with reality, fixes legacy rows automatically, and removes a brittle create-time dependency.

## What Changes

- Stop setting `thumbnailR2ObjectKey` in `speeches.create`; new speeches start with `thumbnailR2ObjectKey` null and `thumbnailProcessStatus` `pending`.
- Assign `thumbnailR2ObjectKey` to `speeches/{id}/thumbnail.webp` in the `speech-thumbnail` queue worker when processing begins (transition to `processing`).
- Remove the worker guard that throws when the key is missing; derive the key from the speech id instead.
- On `speeches.regenerateThumbnail`, delete any existing thumbnail object, clear `thumbnailR2ObjectKey` to null, reset status to `pending`, and enqueue—the worker re-assigns the key on the next run.
- Publish readiness and `getById` thumbnail URL resolution remain unchanged: require a non-null key and stored object only when `thumbnailProcessStatus` is `finished`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `speeches`: Thumbnail key no longer pre-assigned at create; assigned during thumbnail processing; regenerate clears key before re-enqueue.
- `speech-thumbnail-jobs`: Worker assigns `thumbnailR2ObjectKey` at processing start and persists it before upload.

## Impact

- **API**: `speeches.create` (remove key from create payload); `speeches.regenerateThumbnail` (clear key on reset)
- **Queue worker**: `src/lib/speech-thumbnail-processing.ts`
- **Readiness / publish**: No behavior change for publish gate (still requires finished thumbnail + object)
- **CMS**: `getById` returns no thumbnail URL until processing completes (same as today for in-progress speeches)
- **Database**: No schema migration; nullable column already supports this pattern
- **Legacy speeches**: Automatically recover on next thumbnail job without manual SQL backfill
