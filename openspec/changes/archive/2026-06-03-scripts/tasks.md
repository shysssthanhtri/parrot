## 1. Database

- [x] 1.1 Add `Script` model to `prisma/schema.prisma` (`title`, `content`, optional `userId`, timestamps) and relation on `User`
- [x] 1.2 Create and apply migration for `Script`

## 2. tRPC scripts API

- [x] 2.1 Implement `scripts.list`, `getById`, `create`, and `update` in `src/trpc/routers/scripts.ts` with Zod validation (non-empty title and content)
- [x] 2.2 Mount `scriptsRouter` on `src/trpc/routers/_app.ts`

## 3. Routes

- [x] 3.1 Add `SCRIPT_NEW` and `SCRIPT_DETAIL(id)` to `src/app/configs/routes.ts`

## 4. CMS list page

- [x] 4.1 Create `src/app/(cms)/cms/scripts/page.tsx` with server fetch via tRPC caller
- [x] 4.2 Create `scripts-table.tsx`: columns title, content snippet, updated; row click → detail; empty state
- [x] 4.3 Add **New script** button linking to `/cms/scripts/new`

## 5. Shared form and create page

- [x] 5.1 Create `script-form.tsx` client component (title, content, create vs update submit)
- [x] 5.2 Create `src/app/(cms)/cms/scripts/new/page.tsx` with empty form; on success redirect to `SCRIPT_DETAIL(id)`

## 6. CMS detail (edit) page

- [x] 6.1 Create `src/app/(cms)/cms/scripts/[scriptId]/page.tsx` loading script and prefilled form
- [x] 6.2 On update success: stay on page and show `toast.success` via sonner
- [x] 6.3 Add `not-found.tsx` for missing script id
