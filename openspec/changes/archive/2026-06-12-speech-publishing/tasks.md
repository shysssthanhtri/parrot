## 1. Schema and shared helpers

- [x] 1.1 Add `SpeechPublication` model to `prisma/schema.prisma` with snapshot fields, unique `speechId`, and indexes on `status`, `language`, and `topicIds`; add relation on `Speech`; run migration
- [x] 1.2 Create `src/lib/speech-publication.ts` with snapshot builder, publish validation (`finished`, alignment, audio exists), and `assertSpeechNotPublished` guard helper

## 2. API — speech publications router

- [x] 2.1 Create `src/trpc/routers/speech-publications.ts` with `getBySpeechId` (cms), `publish`, `unpublish`, and `unpublishAndRegenerate` (transactional unpublish + regenerate reset)
- [x] 2.2 Add learner `list` (optional `language`, `topicId` filters) and `getById` on `authProcedure`; register router in `src/trpc/routers/_app.ts`

## 3. API — speech guards and detail

- [x] 3.1 Reject `speeches.regenerate` and `speeches.delete` when publication `status` is `published` in `src/trpc/routers/speeches.ts`
- [x] 3.2 Extend `speeches.getById` to include publication summary and set `canRegenerate` false when published

## 4. CMS — publishing UI on speech detail

- [x] 4.1 Add `speech-publishing-card.tsx` with status display, **Publish**, **Unpublish**, and disabled publish while not `finished`
- [x] 4.2 Add `speech-unpublish-and-regenerate-button.tsx` with confirmation dialog; wire mutations in `speech-detail-client.tsx`
- [x] 4.3 Integrate Publishing card and publication metadata into `speech-detail.tsx`; hide standard **Regenerate** when published; gate **Delete speech** in `speech-delete-button.tsx`
