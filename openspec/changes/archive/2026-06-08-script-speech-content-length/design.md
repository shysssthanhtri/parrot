## Context

Scripts store `content` as text and speeches reference a script for TTS. Neither model persists how long the text is. CMS list pages show title, language, and snippets but no length metric. The speech create form lists scripts by title only, which makes it hard to pick shorter vs longer scripts for preview and generation.

Length must be computed by the server when saving — not accepted from clients — so values stay consistent with stored content.

## Goals / Non-Goals

**Goals:**

- Add `contentLength Int` to `Script` and `Speech` in Prisma
- Compute length as JavaScript string length (`content.length`, UTF-16 code units) in tRPC create/update paths
- On `speeches.create`, snapshot the linked script's content length at save time into `Speech.contentLength`
- Backfill existing rows in migration
- Display length in scripts list, speeches list, and speech create script picker
- Format length for display as a locale-aware integer with a "chars" suffix (e.g. `1,234 chars`)

**Non-Goals:**

- Word count, byte size, or estimated speaking duration
- Recomputing speech length when a script is edited later (speech length is a snapshot)
- Accepting `contentLength` from API clients
- Sorting or filtering tables by length in v1
- Showing length on script create/edit forms (computed only on save)

## Decisions

### Field name and type

Add `contentLength Int` (non-null) to both models. Name matches camelCase Prisma convention used elsewhere (`r2ObjectKey`, `repetitionPenalty`).

**Alternative:** `characterCount` — rejected; `contentLength` is shorter and aligns with user language ("content length").

### Length semantics

Use `content.length` in the server router layer (same as JavaScript in the browser). This counts UTF-16 code units, which is consistent with how the CMS already uses `content.length` for snippets.

**Alternative:** Grapheme cluster count — rejected; unnecessary complexity for CMS browsing.

### Server-side computation

- `scripts.create` / `scripts.update`: set `contentLength: input.content.length` in Prisma `data`
- `speeches.create`: after loading the script via `loadValidatedSpeechInputs`, set `contentLength: script.content.length`

Do not add `contentLength` to Zod input schemas.

**Alternative:** Prisma middleware or DB trigger — rejected; explicit in routers is easier to trace and test.

### Migration backfill

Single migration adding columns with a data backfill step:

- `Script`: `UPDATE "Script" SET "contentLength" = char_length("content")` (PostgreSQL `char_length` counts characters, close enough; or use a script — actually for UTF-16 surrogate pairs, PostgreSQL `char_length` counts Unicode code points while JS `.length` counts UTF-16 units. For most content they're the same. For emoji-heavy text they may differ slightly.

Actually, for consistency with runtime JS `.length`, the backfill should ideally match. In PostgreSQL:

- `length(content)` returns character count (not bytes)
- For BMP text, `length()` matches JS `.length`
- For surrogate pairs (emoji), PostgreSQL `length()` counts one character per grapheme while JS counts 2 for a surrogate pair

For migration backfill, using `length("content")` in SQL is acceptable for existing data — minor drift only for rare emoji edge cases. At runtime, always use JS `.length`.

Default `0` for the column during migration, then backfill, then set NOT NULL.

For `Speech`: backfill from joined script: `UPDATE "Speech" s SET "contentLength" = length(sc."content") FROM "Script" sc WHERE s."scriptId" = sc.id`. Speeches without resolvable script get `0`.

### Display helper

Add `formatContentLength(n: number): string` in a small shared module (e.g. `src/lib/content-length.ts`) returning `${n.toLocaleString()} chars`. Reuse in tables and script picker.

**Alternative:** Inline formatting in each component — rejected; one helper keeps copy consistent.

### Speech create script picker

Render each `SelectItem` as `{title} ({formatted length})`, e.g. `Morning routine (842 chars)`.

### CMS tables

- Scripts table: add **Length** column between Language and Content (or after Content — after Language keeps snippet + length together logically; put after Language)
- Speeches table: add **Length** column (shows snapshotted speech length, not live script length)

Update speeches list loading skeleton to include the Length column.

## Risks / Trade-offs

| Risk                                                  | Mitigation                                                            |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| SQL backfill vs JS `.length` mismatch for emoji       | Runtime always uses JS; backfill drift is negligible for CMS browsing |
| Script edit does not update existing speeches' length | By design — speech length is snapshot at generation time              |
| Column added to API responses                         | Harmless additive field; no breaking change                           |

## Migration Plan

1. Add `contentLength` to `Script` and `Speech` in `schema.prisma`
2. Run migration with backfill SQL for existing rows
3. Deploy app code that computes length on create/update in same release

Rollback: revert app; columns can remain.

## Open Questions

- None for v1.
