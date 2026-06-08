## Why

Scripts and speeches store text content but not its length, making it hard to compare scripts, pick appropriate content for TTS, and scan list views. Persisting a server-computed character count at save time gives CMS users a reliable metric without manual entry.

## What Changes

- Add `contentLength` (integer, non-null) to Prisma `Script` and `Speech` models with migration
- Compute `contentLength` server-side as `content.length` (JavaScript UTF-16 code units) on `scripts.create` and `scripts.update`; clients MUST NOT supply it
- Compute and persist `contentLength` on `speeches.create` from the linked script's content at save time (snapshot; not client-supplied)
- Backfill existing script rows with `contentLength` derived from stored `content`; existing speech rows backfilled from linked script content (or `0` if script missing)
- Show script length in the speech create page script picker (alongside title)
- Add a Length column to CMS scripts and speeches list tables
- Optionally show length on speech detail page metadata

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `scripts`: Add `contentLength` to model; create/update compute and persist it
- `speeches`: Add `contentLength` to model; create computes from script content
- `cms-scripts`: List table shows content length column
- `cms-speeches`: Script picker shows length; list table shows content length column

## Impact

- **Code**: `prisma/schema.prisma`, new migration, `src/trpc/routers/scripts.ts`, `src/trpc/routers/speeches.ts`, `scripts-table.tsx`, `speeches-table.tsx`, `speech-create-form.tsx`, optional speech detail page
- **Data**: New columns on `Script` and `Speech`; backfill migration for existing rows
- **Dependencies**: None
- **API**: No new procedures; list/get responses include `contentLength`. Create/update mutations do not accept `contentLength` from clients.
