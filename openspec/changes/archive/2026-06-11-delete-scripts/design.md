## Context

Scripts are created and edited via `scripts.create` / `scripts.update` and linked to topics (M2M), optional `ScriptGeneration` records, and zero or more `Speech` rows. `Speech.scriptId` uses `onDelete: Restrict`, so a script cannot be deleted until its speeches are removed first. `SpeechChunk` cascades on speech delete; `ScriptGeneration.scriptId` uses `onDelete: SetNull`; topic associations disconnect when the script row is deleted. Speech deletion was recently implemented (`speeches.delete`) with storage cleanup for final WAVs and temp chunk files. The CMS script detail page (`/cms/scripts/[scriptId]`) currently has no delete control. Topic and speech delete buttons establish the UX pattern: destructive button + shadcn `AlertDialog` + tRPC mutation + redirect + toast.

## Goals / Non-Goals

**Goals:**

- Let CMS users permanently delete a script from the detail page
- Cascade-delete all related speeches (with full storage cleanup) before removing the script row
- Clear topic associations and unlink `ScriptGeneration` records automatically
- When the script has speeches, show a confirmation dialog that warns about deleting those speeches and their audio
- Redirect to `/cms/scripts` on success with a toast

**Non-Goals:**

- Bulk delete from the scripts list table
- Deleting linked topics or voices
- Soft delete / archive
- Blocking delete while speeches are `pending` or `processing` (speeches delete at any status)

## Decisions

### 1. Delete speeches before script row

**Decision:** In `scripts.delete`, load the script with all speeches (including chunks). For each speech, collect storage keys and call `deleteObjects`, then delete speech rows (cascading `SpeechChunk`). Finally `prisma.script.delete`.

**Rationale:** `Speech.scriptId` is `onDelete: Restrict`; speeches must be removed first. Reuses the same storage cleanup sequence as `speeches.delete`.

**Alternative considered:** Change FK to `onDelete: Cascade` via migration — rejected; explicit cleanup is needed for R2 objects anyway, and application-level delete keeps storage logic in one place.

### 2. Inline speech cleanup in scripts.delete (no shared helper for v1)

**Decision:** Duplicate the storage-key collection + `deleteObjects` + `prisma.speech.delete` loop inside `scripts.delete`, matching `speeches.delete` logic.

**Rationale:** Only two call sites; extracting a helper is optional follow-up. Keeps the change minimal.

**Alternative considered:** Extract `deleteSpeechWithStorage(speechId)` shared helper — deferred unless a third caller appears.

### 3. Expose speech count on getById

**Decision:** Add `_count: { select: { speeches: true } }` to `scripts.getById` include. UI reads `script._count.speeches` for confirmation copy.

**Rationale:** Single round-trip; count is only needed on detail page today.

### 4. UI pattern: `ScriptDeleteButton` component

**Decision:** New `script-delete-button.tsx` on the script detail page, modeled on `speech-delete-button.tsx`. Always show a confirmation dialog before delete. When `_count.speeches > 0`, dialog copy warns that N speech(es) and their generated audio will also be permanently deleted. When count is 0, show a simpler confirmation (title only, no speech warning).

**Rationale:** User requested confirmation when speeches exist; a basic confirm for speech-free scripts matches other CMS delete controls and prevents accidental deletion.

### 5. No schema migration

**Decision:** Rely on existing FK behaviors. No Prisma changes.

**Rationale:** Cascade behavior is achieved in application code for speeches (storage + delete); other relationships already handle script removal correctly.

## Risks / Trade-offs

- **[In-flight TTS jobs for deleted speeches]** → Same as `speeches.delete`; workers no-op or fail harmlessly when speech rows are gone. Acceptable for v1.
- **[Storage delete partial failure]** → If `deleteObjects` fails, abort before DB deletes and surface error. Same pattern as speech delete.
- **[Large speech count]** → Script with many speeches deletes sequentially; acceptable for expected CMS scale.

## Migration Plan

No migration. Deploy API + UI together. Existing scripts are unaffected until a user deletes one.

## Open Questions

_None — scope is clear from user request._
