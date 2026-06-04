## 1. Loading route

- [x] 1.1 Add `src/app/(cms)/cms/voices/loading.tsx` with the same page shell as `page.tsx` (`flex flex-col gap-4 p-4 md:p-6`) and static `h1` "Voices"

## 2. Table skeleton

- [x] 2.1 Build a table skeleton using shadcn `Table` (headers: Name, Language, Description, Updated) and `Skeleton` cells in ~6 body rows
- [x] 2.2 Extract to `voices-list-skeleton.tsx` under `_components/` only if `loading.tsx` exceeds a reasonable inline size

## 3. Verification

- [ ] 3.1 Navigate to `/cms/voices` from the CMS sidebar and confirm skeleton appears before the table (throttle network in devtools if needed)
- [ ] 3.2 Confirm loaded state still shows the table or "No voices yet." empty state with no layout regressions
