## Context

`ScriptGeneration` already stores target spoken duration as `length` (`short` | `medium` | `long`), mapped to ~30s / ~1m / ~5m in `src/lib/script-generation-prompt.ts`. Saved `Script` rows only store `contentLength` (character count). The CMS scripts list labels a **Length** column but renders `contentLength` with a "chars" suffix, which does not match author intent for shadowing duration.

Authors need target duration on the script itself—for manual entry, post-save edits, list scanning, and downstream speech planning—without re-opening generation history.

## Goals / Non-Goals

**Goals:**

- Persist `length` on `Script` using the same enum values as `ScriptGeneration`
- Accept `length` on `scripts.create` and `scripts.update` with Zod validation
- When creating with `generationId`, derive `length` from the linked `ScriptGeneration` row server-side
- Expose length on the shared script form (create and edit) and pre-fill it after AI generation
- Show human-readable duration labels in the CMS scripts list **Length** column

**Non-Goals:**

- Inferring or auto-updating `length` from `content.length` heuristics
- Changing `ScriptGeneration` behavior or the generate dialog UX beyond passing selected length back to the form
- Replacing or removing `contentLength` from the model (still computed on save)
- Learner-facing duration display or filtering

## Decisions

### 1. Reuse `SCRIPT_GENERATION_LENGTHS` as the single source of truth

**Choice:** Import `SCRIPT_GENERATION_LENGTHS` and `ScriptGenerationLength` from `src/lib/script-generation-prompt.ts` in the scripts router Zod schema and CMS UI option lists.

**Alternatives:** Duplicate enum in Prisma `@enum` or a new `script-length.ts` module.

**Rationale:** Keeps generation and persistence aligned; one place to update duration mappings.

### 2. Prisma field: non-null `String` column named `length`

**Choice:** Add `length String` to `Script` (same storage style as `ScriptGeneration.length`), default `medium` in migration for backfill.

**Alternatives:** Prisma native enum; nullable column.

**Rationale:** Matches existing `ScriptGeneration` pattern; non-null avoids ambiguous scripts in CMS.

### 3. Server derives length from generation on create

**Choice:** In `scripts.create`, when `generationId` is present, read `ScriptGeneration.length` inside the transaction and persist that value, ignoring any client-supplied `length`.

**Alternatives:** Trust client `length`; make `length` optional when `generationId` is set.

**Rationale:** Generation record is authoritative; prevents mismatch between prompt target and saved script.

### 4. Shared display helper for CMS labels

**Choice:** Add `getScriptLengthLabel(length: ScriptGenerationLength)` (e.g. `Short (~30s)`) in `src/lib/script-generation-prompt.ts` or a thin `src/lib/script-length.ts` re-exporting constants.

**Alternatives:** Inline labels in table and form components.

**Rationale:** Same labels in list, form, and generate dialog; mirrors `getScriptLanguageLabel`.

### 5. List table **Length** column shows target duration, not char count

**Choice:** Replace `formatContentLength(script.contentLength)` with `getScriptLengthLabel(script.length)` in `scripts-table.tsx`.

**Alternatives:** Add a second column; keep chars in Length column.

**Rationale:** Aligns column header with author mental model; `contentLength` remains available on the model and in APIs for other surfaces.

## Risks / Trade-offs

- **[Risk] Existing scripts lack accurate duration** → Backfill `medium` by default; SQL/data migration sets `length` from linked `ScriptGeneration.length` where `scriptId` is set
- **[Risk] Authors pick duration that does not match edited content** → Accepted; duration is author metadata, not enforced against word count
- **[Risk] Breaking change for API clients sending create/update without `length`** → Zod requires `length`; CMS is the only client today

## Migration Plan

1. Add `length` column to `Script` with default `medium`
2. Backfill: `UPDATE Script SET length = sg.length FROM ScriptGeneration sg WHERE sg.scriptId = Script.id`
3. Deploy migration before app code that requires `length` on read paths
4. Rollback: revert app deploy; column can remain unused until dropped in a follow-up if needed

## Open Questions

<!-- none -->
