## Context

Speeches are created via `speeches.create`, which enqueues async TTS processing. Audio is stored using the shared storage abstraction (`uploadObject`, `deleteObjects`) with keys `speeches/{id}.wav` (final) and `speeches/{id}/chunks/{index}.wav` (temp). `SpeechChunk` rows already cascade-delete when a `Speech` row is removed (`onDelete: Cascade` in Prisma). The CMS speech detail page is currently read-only and explicitly excludes delete in v1 specs. Topic deletion already establishes the UI pattern: destructive button + shadcn `AlertDialog` + tRPC mutation + redirect + toast.

## Goals / Non-Goals

**Goals:**

- Let CMS users permanently delete a speech from the detail page
- Remove all `SpeechChunk` rows (via DB cascade) and all related storage objects (final + temp chunk WAVs)
- Reuse existing storage helpers and match the topic-delete UX pattern
- Allow deletion at any `processStatus` so failed or stuck generations can be discarded

**Non-Goals:**

- Bulk delete from the speeches list table
- Deleting linked voices or scripts (FKs remain `onDelete: Restrict` on the speech side)
- Canceling in-flight queue jobs explicitly (workers already no-op when the speech row is missing in finalize; other jobs may error and exhaust retries harmlessly)
- Soft delete / archive

## Decisions

### 1. Storage cleanup before DB delete

**Decision:** Collect all object keys (`speech.r2ObjectKey` + each chunk's `tempR2Key`), call `deleteObjects`, then `prisma.speech.delete`.

**Rationale:** Mirrors `speeches.retry`, which already deletes temp chunk files before resetting DB state. Deleting storage first avoids leaving orphaned R2 objects if the DB delete fails after storage cleanup; orphaned DB rows without storage are less costly than orphaned paid storage.

**Alternative considered:** DB delete first, then storage cleanup — rejected because cascade removes chunk rows before we can read `tempR2Key` values unless we load them first anyway.

### 2. Allow delete for any process status

**Decision:** No status guard on `speeches.delete`.

**Rationale:** Users may want to remove in-progress or failed speeches. Temp chunks and partial final files should still be cleaned up.

**Alternative considered:** Block delete while `pending`/`processing` — rejected; forces users to wait for completion or failure.

### 3. UI pattern: `SpeechDeleteButton` component

**Decision:** New `speech-delete-button.tsx` alongside the detail page, modeled on `topic-delete-button.tsx` (destructive button, confirmation dialog, `speeches.delete` mutation, toast, redirect to `ROUTES.CMS.SPEECHES`).

**Rationale:** Consistent CMS destructive-action UX; keeps `SpeechDetail` presentational.

### 4. No schema migration

**Decision:** Rely on existing `SpeechChunk` → `Speech` cascade FK. No Prisma changes.

**Rationale:** User asked for cascade on relationships; only child `SpeechChunk` rows need cascade on speech delete. Voice/script must remain.

## Risks / Trade-offs

- **[In-flight TTS jobs]** → Start/chunk workers may throw when speech is gone; jobs retry until max then stop. Finalize already returns early if speech is missing. Acceptable for v1.
- **[Storage delete partial failure]** → `deleteObjects` uses `Promise.all`; one failed key could abort the batch. Mitigation: same pattern as retry; log and surface error to user without deleting DB row if storage step fails first.
- **[Deleting while user has audio playing]** → Redirect clears the page; acceptable.

## Migration Plan

No migration. Deploy API + UI together. Existing speeches are unaffected until a user deletes one.

## Open Questions

_None — scope is clear from user request._
