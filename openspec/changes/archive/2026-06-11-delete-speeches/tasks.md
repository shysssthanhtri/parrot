## 1. API — speeches.delete

- [x] 1.1 Add `speeches.delete` mutation in `src/trpc/routers/speeches.ts` accepting `{ id: string }`
- [x] 1.2 Load speech with `chunks` include; return `NOT_FOUND` if missing
- [x] 1.3 Collect storage keys (`r2ObjectKey` + all `tempR2Key` values) and call `deleteObjects` before DB delete
- [x] 1.4 Delete speech row via `prisma.speech.delete` (cascades `SpeechChunk` rows) and return `{ success: true }`

## 2. CMS — delete button on speech detail page

- [x] 2.1 Create `speech-delete-button.tsx` modeled on `topic-delete-button.tsx` (AlertDialog, destructive button, toast, redirect to speeches list)
- [x] 2.2 Wire delete button into speech detail page layout (e.g. page header or `speech-detail-client.tsx`)
- [x] 2.3 Pass speech id and script title to the delete button for confirmation copy

## 3. Verification

- [x] 3.1 Manually verify deleting a finished speech removes the row, chunk rows, and R2/local audio objects
- [x] 3.2 Manually verify deleting a processing or failed speech cleans up temp chunk objects
- [x] 3.3 Manually verify canceling the dialog does not call the API and successful delete redirects to `/cms/speeches`
