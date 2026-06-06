## Context

Parrot's CMS already manages scripts (`title`, `content`) and voices (`name`, `description`, `language`). Voices store language as a BCP-47-style string (default `en-US`) and display it in the list and detail pages. Scripts lack this field, so there is no way to record or browse content by language before pairing scripts with voices for speeches.

The change is additive: one new string column, extended tRPC inputs with enum validation, and CMS UI with a curated language select.

## Goals / Non-Goals

**Goals:**

- Add `language` to the Prisma `Script` model with default `en-US` (plain string column)
- Migrate existing script rows to `en-US`
- Accept and validate `language` in `scripts.create` and `scripts.update` against a fixed supported set
- Show language in the scripts list table using human-readable labels
- Add a language **select** to the shared `ScriptForm` with five options (default English on create)

**Non-Goals:**

- Free-text language input in the CMS UI
- Filtering or sorting scripts by language in the CMS
- Validating that script language matches a paired voice (speeches not built yet)
- Changing voice CMS (voices remain read-only for language)
- Adding languages beyond the initial five without a follow-up change

## Decisions

### Supported languages (v1)

Store BCP-47-style codes in the database; show friendly labels in the UI:

| Label      | Stored value |
| ---------- | ------------ |
| English    | `en-US`      |
| Vietnamese | `vi-VN`      |
| Chinese    | `zh-CN`      |
| Korean     | `ko-KR`      |
| Japanese   | `ja-JP`      |

Define once in a shared module (e.g. `src/lib/script-languages.ts`) as `{ value, label }[]` plus a lookup map for list display. Default: `en-US`.

**Alternative:** Store display labels (`English`, `Vietnamese`, …) — rejected; codes align with `Voice.language` and future TTS/locale APIs.

### Prisma field

Add `language String @default("en-US")` to `Script`. Column remains a plain string — no DB enum.

**Alternative:** PostgreSQL enum type — rejected; string column is simpler to extend later.

### Migration

Single migration adding `language` with `@default("en-US")` so existing rows backfill automatically.

### tRPC validation

Extend `scriptFieldsSchema` with `language` validated via `z.enum(SUPPORTED_SCRIPT_LANGUAGE_CODES)` (the five codes above), defaulting to `en-US` on create. Reject unknown codes with a validation error.

List and getById return the stored string; CMS maps codes to labels for display.

### CMS form input

Use shadcn `Select` labeled "Language" with the five options. Default selection `en-US` on create; prefill from script on edit.

**Alternative:** Free-text `Input` — rejected per product requirement for a fixed select.

### CMS list table

Add a `Language` column between `Title` and `Content`. Render the human-readable label via the shared lookup (fallback to raw code if unknown legacy value).

## Risks / Trade-offs

| Risk                                        | Mitigation                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| Legacy rows with unsupported codes          | Migration backfills to `en-US`; list falls back to raw string if lookup misses |
| Adding languages later                      | Extend shared constant + Zod enum in one place; no schema migration needed     |
| Existing API clients send arbitrary strings | Zod enum rejects invalid values with clear validation error                    |
| Column width on narrow screens              | Labels are short; truncate content snippet if needed                           |

## Migration Plan

1. Add `language` to `schema.prisma` and run project migration command
2. Deploy migration (existing rows get `en-US`)
3. Ship shared language constants, tRPC validation, and CMS changes in the same release

Rollback: revert app code; column can remain with default `en-US`.

## Open Questions

- None for v1 — five languages and BCP-47 codes are defined above.
