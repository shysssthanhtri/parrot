## 1. Database

- [x] 1.1 Add `contentLength Int` to `Script` and `Speech` models in `prisma/schema.prisma`
- [x] 1.2 Create and apply migration with backfill: set `Script.contentLength` from content, set `Speech.contentLength` from linked script content

## 2. Shared display helper

- [x] 2.1 Create `src/lib/content-length.ts` with `formatContentLength(n: number): string` returning locale-formatted count with "chars" suffix

## 3. tRPC scripts API

- [x] 3.1 Set `contentLength: input.content.length` in `scripts.create` and `scripts.update` in `src/trpc/routers/scripts.ts` (do not add to input schema)

## 4. tRPC speeches API

- [x] 4.1 Set `contentLength: script.content.length` in `speeches.create` in `src/trpc/routers/speeches.ts` after loading the script

## 5. CMS scripts list

- [x] 5.1 Add `contentLength` to `ScriptRow` type and a Length column in `scripts-table.tsx` using `formatContentLength`

## 6. CMS speeches list

- [x] 6.1 Add `contentLength` to `SpeechRow` type and a Length column in `speeches-table.tsx` using `formatContentLength`
- [x] 6.2 Update `src/app/(cms)/cms/speeches/loading.tsx` skeleton to include a Length column

## 7. CMS speech create page

- [x] 7.1 Show script title and formatted length in each `SelectItem` in `speech-create-form.tsx`

## 8. Verification

- [x] 8.1 Manually verify: create/update script updates length; create speech stores length; list tables and script picker display formatted length
