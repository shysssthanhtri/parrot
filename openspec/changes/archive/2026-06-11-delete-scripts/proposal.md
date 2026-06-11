## Why

Scripts can be created and edited in the CMS but cannot be removed once saved. CMS users need a way to delete unwanted scripts without leaving orphaned speeches, topic links, or generation records behind.

## What Changes

- Add a `scripts.delete` tRPC mutation that removes a script by id and cascades cleanup of all related data: linked speeches (including R2/local audio and `SpeechChunk` rows), topic associations, and `ScriptGeneration` links (`scriptId` set null via existing FK).
- Extend `scripts.getById` to include a speech count so the UI can decide confirmation copy.
- Add a **Delete script** control on the CMS script detail page (`/cms/scripts/[scriptId]`) with a confirmation dialog; when the script has one or more speeches, the dialog SHALL warn that those speeches and their audio will also be deleted.
- On successful delete, redirect to `/cms/scripts` with a success toast.

## Capabilities

### New Capabilities

_None — this extends existing script capabilities rather than introducing a new domain._

### Modified Capabilities

- `scripts`: Add `scripts.delete` API with cascade cleanup of speeches and relationships; extend `scripts.getById` to expose speech count.
- `cms-scripts`: Add delete control on the script detail page with speech-aware confirmation and post-delete navigation.

## Impact

- `src/trpc/routers/scripts.ts` — new `delete` mutation; `getById` includes `_count.speeches`
- `src/trpc/routers/speeches.ts` — reuse speech storage cleanup pattern (or shared helper) when deleting speeches as part of script delete
- `src/lib/storage` — reuse existing `deleteObjects` helper
- `src/app/(cms)/cms/scripts/[scriptId]/` — delete button component and wiring on detail page
- `prisma/schema.prisma` — no migration expected (`SpeechChunk` cascades on speech delete; `ScriptGeneration.scriptId` uses `onDelete: SetNull`; topic M2M disconnects on script delete)
