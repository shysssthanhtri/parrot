## 1. Remove unpublish and regenerate

- [x] 1.1 Remove `unpublishAndRegenerate` from `src/trpc/routers/speech-publications.ts`
- [x] 1.2 Delete `speech-unpublish-and-regenerate-button.tsx` and remove props/wiring from `speech-publishing-card.tsx` and `speech-detail-client.tsx`

## 2. Database and storage

- [x] 2.1 Add `thumbnailR2ObjectKey`, `thumbnailProcessStatus`, and `thumbnailErrorMessage` to `Speech` and `thumbnailR2ObjectKey` to `SpeechPublication` in `prisma/schema.prisma`; run migration
- [x] 2.2 Add `speechThumbnailObjectKey` helper in `src/lib/storage/speech-keys.ts`; include thumbnail key in `speeches.delete` storage cleanup

## 3. Publish readiness

- [x] 3.1 Create `src/lib/speech-publish-readiness.ts` with extensible checker list (audio, alignment, storage, thumbnail)
- [x] 3.2 Refactor `buildPublicationSnapshot` in `src/lib/speech-publication.ts` to use `assertSpeechReadyToPublish` and include `thumbnailR2ObjectKey` in snapshot
- [x] 3.3 Add `speeches.getPublishReadiness` query in `src/trpc/routers/speeches.ts`

## 4. Modal and CI

- [x] 4.1 Implement `modal/speech_thumbnail.py` (SD 3.5 Medium Turbo, A10G, `max_containers=1`, `max_inputs=1`, 832×1088, authenticated `POST /generate`)
- [x] 4.2 Add `.github/workflows/deploy-modal-thumbnail-image.yml`
- [x] 4.3 Add `thumbnail-api-key` sync step to `.github/workflows/setup-modal-secrets.yml`
- [x] 4.4 Add `THUMBNAIL_API_URL` and `THUMBNAIL_API_KEY` to `.env.example` and `src/lib/env.ts`

## 5. Thumbnail client and queue

- [x] 5.1 Create `src/lib/thumbnail/generateThumbnail.ts` (server-only Modal HTTP client)
- [x] 5.2 Create `src/lib/speech-thumbnail-jobs.ts` with `enqueueSpeechThumbnail` and message types
- [x] 5.3 Create `src/lib/speech-thumbnail-processing.ts` (prompt build, Modal call, upload, status updates)
- [x] 5.4 Add `src/app/api/queues/speech-thumbnail/route.ts` and register topic in `vercel.json` with `maxConcurrency: 1`
- [x] 5.5 Enqueue thumbnail on `speeches.create`; add `speeches.regenerateThumbnail` with `assertSpeechNotPublished`

## 6. API extensions

- [ ] 6.1 Extend `speeches.getById` with thumbnail fields and resolved thumbnail URL
- [ ] 6.2 Extend `speechPublications.list` and `getById` with `thumbnailUrl` from snapshot key

## 7. CMS UI

- [ ] 7.1 Add Thumbnail card component under `src/app/(cms)/cms/speeches/[speechId]/_components/` (preview, status, regenerate, polling)
- [ ] 7.2 Wire Thumbnail card into `speech-detail.tsx` / `speech-detail-client.tsx`
- [ ] 7.3 Update Publishing card to use `getPublishReadiness` for **Publish** enablement and blocker copy
