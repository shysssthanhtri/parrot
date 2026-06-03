## Why

Parrot is an English shadowing app where generated speeches combine a voice with a script. Voices are in place; we need scripts so the CMS can manually author and maintain the text content that will later be paired with voices for speeches.

## What Changes

- Prisma `Script` model (`title`, `content`, optional `userId`, timestamps) and migration
- tRPC `scripts` router with `list`, `getById`, `create`, and `update` procedures, mounted on `appRouter`
- CMS list page at `/cms/scripts` (table, row navigation, **New script** button)
- CMS create page at `/cms/scripts/new` using a shared form; on save, redirect to detail
- CMS detail page at `/cms/scripts/[scriptId]` using the same shared form; on save, stay on page with success toast
- Route helpers `SCRIPT_NEW` and `SCRIPT_DETAIL(id)` in `src/app/configs/routes.ts`

No delete UI or API. No speeches, TTS, import, or voice linkage on scripts. No `createdBy` display in CMS.

## Capabilities

### New Capabilities

- `scripts`: Script metadata in PostgreSQL, tRPC read/write APIs for CMS
- `cms-scripts`: Authenticated CMS list, create (`/new`), and detail-with-form pages

### Modified Capabilities

<!-- none -->

## Impact

- **Code**: `prisma/schema.prisma`, new migration, `src/trpc/routers/scripts.ts`, `src/trpc/routers/_app.ts`, `src/app/(cms)/cms/scripts/`, `src/app/configs/routes.ts`
- **Data**: New `Script` table
- **Dependencies**: None expected beyond existing stack (Prisma, tRPC, shadcn)
- **Systems**: CMS sidebar already links to `/cms/scripts`; pages will replace 404
