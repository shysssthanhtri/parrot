## 1. API — scripts.getById speech count

- [x] 1.1 Add `_count: { select: { speeches: true } }` to `scripts.getById` include

## 2. API — scripts.delete

- [x] 2.1 Add `scripts.delete` mutation in `src/trpc/routers/scripts.ts` accepting `{ id: string }`
- [x] 2.2 Load script with speeches and chunks include; return `NOT_FOUND` if missing
- [x] 2.3 For each linked speech, collect storage keys (`r2ObjectKey` + all `tempR2Key` values) and call `deleteObjects`, then delete the speech row (cascades `SpeechChunk` rows)
- [x] 2.4 Delete script row via `prisma.script.delete` and return `{ success: true }`

## 3. CMS — delete button on script detail page

- [x] 3.1 Create `script-delete-button.tsx` modeled on `speech-delete-button.tsx` (AlertDialog, destructive button, toast, redirect to scripts list)
- [x] 3.2 Show speech-aware confirmation copy when `_count.speeches > 0` (warn about deleting speeches and audio)
- [x] 3.3 Wire delete button into script detail page (`/cms/scripts/[scriptId]`) with script id, title, and speech count

## 4. Verification

- [x] 4.1 Manually verify deleting a script with no speeches removes the row and topic associations
- [x] 4.2 Manually verify deleting a script with speeches removes speech rows, chunk rows, storage objects, and the script row
- [x] 4.3 Manually verify canceling the dialog does not call the API and successful delete redirects to `/cms/scripts`
