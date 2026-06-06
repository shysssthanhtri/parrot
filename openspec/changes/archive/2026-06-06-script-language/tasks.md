## 1. Database

- [x] 1.1 Add `language String @default("en-US")` to the `Script` model in `prisma/schema.prisma`
- [x] 1.2 Create and apply migration with `make migrate-dev NAME=add_script_language`

## 2. Shared language constants

- [x] 2.1 Create `src/lib/script-languages.ts` with supported codes (`en-US`, `vi-VN`, `zh-CN`, `ko-KR`, `ja-JP`), labels (English, Vietnamese, Chinese, Korean, Japanese), and a label lookup helper

## 3. tRPC scripts API

- [x] 3.1 Extend `scriptFieldsSchema` in `src/trpc/routers/scripts.ts` with `language` validated via `z.enum` against supported codes (default `en-US` on create)
- [x] 3.2 Persist `language` in `scripts.create` and `scripts.update` mutations

## 4. CMS list page

- [x] 4.1 Add `language` to `ScriptRow` type and a Language column in `scripts-table.tsx` (between Title and Content), rendering the human-readable label

## 5. Shared form and pages

- [x] 5.1 Add `language` to `ScriptFormValues`, form state, and a shadcn `Select` with the five language options (default `en-US`) in `script-form.tsx`
- [x] 5.2 Include `language` in create/update mutation payloads
- [x] 5.3 Pass `language` in `defaultValues` from `src/app/(cms)/cms/scripts/[scriptId]/page.tsx`

## 6. Verification

- [x] 6.1 Manually verify: create script with each language option, edit language, confirm list shows labels and API stores codes
- [x] 6.2 Confirm existing scripts show English after migration
