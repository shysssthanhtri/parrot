## Context

`Speech.thumbnailR2ObjectKey` is currently pre-assigned in `speeches.create` to `speeches/{id}/thumbnail.webp` before any thumbnail exists. The queue worker in `src/lib/speech-thumbnail-processing.ts` requires a non-null key and throws `Speech has no thumbnail key` otherwise.

Speeches created before the thumbnail migration have `thumbnailR2ObjectKey = null`. Manual regenerate does not assign a key, so those jobs fail permanently. The key pattern is deterministic from the speech id via `speechThumbnailObjectKey(id)` in `src/lib/storage/speech-keys.ts`.

Audio uses a different pattern: `r2ObjectKey` is pre-assigned at create because the upload destination must be known before TTS completes. Thumbnails differ—the worker is the sole writer and can assign the key atomically when processing starts.

## Goals / Non-Goals

**Goals:**

- Assign `thumbnailR2ObjectKey` in the thumbnail queue worker when processing starts, not at speech create.
- Fix legacy speeches with null keys without a one-off SQL backfill.
- Clear the key on manual regenerate so re-processing follows the same path.

**Non-Goals:**

- Changing the key pattern (`speeches/{id}/thumbnail.webp`).
- Changing Modal, storage drivers, or publish snapshot behavior.
- Pre-assigning keys for other asset types (audio `r2ObjectKey` stays create-time).

## Decisions

### 1. Assign key on `pending` → `processing` transition

In `runSpeechThumbnail`, when status is `pending`, update the speech with:

- `thumbnailProcessStatus: "processing"`
- `thumbnailR2ObjectKey: speechThumbnailObjectKey(speechId)` (always set, even if previously null)
- `thumbnailErrorMessage: null`

If status is already `processing` (retry mid-flight) and key is null, assign the key before upload without changing status.

**Alternative:** Assign only on successful upload — rejected; publish readiness and delete need the key to locate the object even if a later step fails.

**Alternative:** Keep create-time assignment and backfill SQL — rejected; does not match the desired lifecycle and leaves regenerate broken for null-key rows.

### 2. Remove create-time key assignment

In `src/trpc/routers/speeches.ts` `create` mutation, remove `thumbnailR2ObjectKey` from the Prisma create payload. New rows start with null key and `thumbnailProcessStatus: "pending"`.

### 3. Clear key on regenerate

In `regenerateThumbnail`:

1. Delete storage object at existing `thumbnailR2ObjectKey` if non-null.
2. Set `thumbnailR2ObjectKey: null`, `thumbnailProcessStatus: "pending"`, clear error message.
3. Enqueue thumbnail job.

Worker re-assigns key on next run.

**Alternative:** Keep key on regenerate — rejected; clearing makes "not yet generated" explicit and matches create behavior.

### 4. Remove throw in `loadSpeechThumbnailContext`

Drop the `Speech has no thumbnail key` guard. Worker derives key from `speechId` when persisting; load function only needs id, status, script metadata.

### 5. No Prisma migration

Column is already nullable. Existing rows with pre-assigned keys continue to work; null-key rows are fixed on next job.

## Risks / Trade-offs

| Risk                                                             | Mitigation                                               |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| Brief window where status is `processing` but upload not done    | Same as today; CMS shows processing state                |
| Orphan storage if job crashes after upload but before `finished` | Key points to object; regenerate deletes by key          |
| `getById` returns no URL while pending/processing                | Already expected; URL only when finished + object exists |

## Migration Plan

1. Deploy code changes (no DB migration).
2. Stuck speeches with null keys: trigger **Regenerate thumbnail** or wait for queued job—worker assigns key automatically.
3. No rollback concerns; pre-assigned keys on existing rows remain valid.

## Open Questions

- None blocking.
