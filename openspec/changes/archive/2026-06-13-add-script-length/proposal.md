## Why

Target spoken duration (`short` / `medium` / `long`, roughly 30 seconds / 1 minute / 5 minutes) is captured only during AI script generation on `ScriptGeneration`, not on the saved `Script`. Authors cannot set or review duration when creating scripts manually, edit it after save, or filter and scan scripts by intended shadowing length in the CMS list.

## What Changes

- Add `length` (`short`, `medium`, or `long`) to the Prisma `Script` model with migration and backfill for existing rows
- Extend tRPC `scripts.create` and `scripts.update` to accept and persist `length`, validated against the same values used by `scriptGenerations.generate`
- When a script is created with a `generationId`, copy `length` from the linked `ScriptGeneration` record server-side (client value ignored for consistency)
- Add a target-length select to the shared script create/edit form (Short ~30s, Medium ~1m, Long ~5m)
- When AI generation fills the form, pre-select the length chosen in the generate dialog
- Update the CMS scripts list **Length** column to display the script's stored target duration (human-readable labels) instead of character count; `contentLength` remains on the model for other uses

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `scripts`: Script metadata model and create/update APIs include required `length` (`short` | `medium` | `long`); create with `generationId` derives length from the generation row
- `cms-scripts`: Shared form exposes target length; list table Length column shows spoken duration labels

## Impact

- **Code**: `prisma/schema.prisma`, new migration, shared length constants/labels (reuse `SCRIPT_GENERATION_LENGTHS` from `src/lib/script-generation-prompt.ts`), `src/trpc/routers/scripts.ts`, `script-form.tsx`, `script-generate-dialog.tsx`, `scripts-table.tsx`, script page loaders for default values, optional `loading.tsx` skeleton column label
- **Data**: New non-null `length` column on `Script`; backfill existing rows to `medium`, overriding with linked `ScriptGeneration.length` when present
- **Dependencies**: None
- **API**: `scripts.create` and `scripts.update` gain required `length`; list/get responses include `length`. No change to `scriptGenerations.generate`.
