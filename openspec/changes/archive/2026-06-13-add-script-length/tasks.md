## 1. Database

- [x] 1.1 Add `length String @default("medium")` to the `Script` model in `prisma/schema.prisma`
- [x] 1.2 Create migration that adds the column, backfills existing rows to `medium`, and sets `length` from linked `ScriptGeneration.length` where `scriptId` is set

## 2. Shared length helpers

- [x] 2.1 Add `SCRIPT_LENGTH_OPTIONS` (value + label pairs) and `getScriptLengthLabel()` in `src/lib/script-generation-prompt.ts`, reusing `SCRIPT_GENERATION_LENGTHS` / `ScriptGenerationLength`

## 3. tRPC scripts API

- [x] 3.1 Extend `scriptFieldsSchema` in `src/trpc/routers/scripts.ts` with required `length` validated via `z.enum(SCRIPT_GENERATION_LENGTHS)`
- [x] 3.2 In `scripts.create`, when `generationId` is present, load the generation row and persist `length` from `ScriptGeneration.length` instead of the client value
- [x] 3.3 Persist `length` in `scripts.create` (manual path) and `scripts.update`

## 4. CMS list page

- [x] 4.1 Add `length` to `ScriptRow` in `scripts-table.tsx` and render `getScriptLengthLabel(script.length)` in the Length column (replacing `formatContentLength`)

## 5. Shared form and pages

- [x] 5.1 Add `length` to `ScriptFormValues`, form state, and a shadcn `Select` with the three duration options (default `medium`) in `script-form.tsx`
- [x] 5.2 Include `length` in create/update mutation payloads
- [x] 5.3 Pass `length` in `defaultValues` from `src/app/(cms)/cms/scripts/[scriptId]/page.tsx`

## 6. AI generation integration

- [x] 6.1 Extend `ScriptGenerateDialog` `onGenerated` callback to include `length` and update `script-form.tsx` to set form length when a draft is generated
- [x] 6.2 Refactor `script-generate-dialog.tsx` to import shared `SCRIPT_LENGTH_OPTIONS` instead of duplicating `LENGTH_OPTIONS`
