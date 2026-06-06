## Why

Scripts are the text half of the shadowing pipeline, but unlike voices they have no language metadata. When speeches pair a voice with a script, both sides need a language so the app can match compatible content and filter the CMS. Adding language to scripts aligns the data model with voices and unblocks future speech generation.

## What Changes

- Add `language` field to the Prisma `Script` model (string, default `en-US`, same as `Voice`)
- Database migration to add the column and backfill existing rows with `en-US`
- Extend tRPC `scripts.create` and `scripts.update` to accept and persist `language`, validated against a fixed set of supported locale codes
- Add language column to the CMS scripts list table (display human-readable labels)
- Add a language **select** to the shared script create/edit form with five options: English, Vietnamese, Chinese, Korean, Japanese (default English on create)

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `scripts`: Script metadata model and create/update APIs include `language` (string in DB, validated to supported codes)
- `cms-scripts`: List table and shared form expose `language` via a fixed select control

## Impact

- **Code**: `prisma/schema.prisma`, new migration, shared script language constants, `src/trpc/routers/scripts.ts`, `src/app/(cms)/cms/scripts/_components/script-form.tsx`, `src/app/(cms)/cms/scripts/_components/scripts-table.tsx`, script page loaders that pass default values
- **Data**: Existing `Script` rows receive `language = en-US` via migration default
- **Dependencies**: None beyond existing stack (shadcn `Select` already available)
- **Systems**: No breaking API changes for read paths; create/update payloads gain an optional `language` field (defaults to `en-US` when omitted)
