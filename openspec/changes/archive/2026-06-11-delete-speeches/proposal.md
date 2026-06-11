## Why

Speeches can be created from scripts and voices but cannot be removed once generated. CMS users need a way to delete unwanted or failed speeches without leaving orphaned audio files in R2 (or local storage) or stale `SpeechChunk` rows in the database.

## What Changes

- Add a `speeches.delete` tRPC mutation that removes a speech by id, cascades deletion of related `SpeechChunk` rows, and cleans up all associated storage objects (final WAV at `r2ObjectKey` and any temp chunk WAVs).
- Add a **Delete speech** control on the CMS speech detail page (`/cms/speeches/[speechId]`) with a confirmation dialog; on success, redirect to the speeches list.
- Allow deletion regardless of `processStatus` (`pending`, `processing`, `finished`, or `failed`) so users can discard in-progress or failed generations.
- Update CMS and API specs to replace the v1 "no delete" constraint with explicit delete requirements.

## Capabilities

### New Capabilities

_None — this extends existing speech capabilities rather than introducing a new domain._

### Modified Capabilities

- `speeches`: Add `speeches.delete` API requirement with storage cleanup and cascade behavior for `SpeechChunk` rows.
- `cms-speeches`: Add delete control on the speech detail page with confirmation and post-delete navigation.

## Impact

- `src/trpc/routers/speeches.ts` — new `delete` mutation
- `src/lib/storage` — reuse existing `deleteObject` / `deleteObjects` helpers (R2 and local)
- `src/app/(cms)/cms/speeches/[speechId]/` — delete button component and wiring in detail client
- `prisma/schema.prisma` — no migration expected (`SpeechChunk` already uses `onDelete: Cascade`)
- In-flight TTS queue jobs for a deleted speech will no-op or fail harmlessly when the speech row is gone (finalize already handles missing speech)
