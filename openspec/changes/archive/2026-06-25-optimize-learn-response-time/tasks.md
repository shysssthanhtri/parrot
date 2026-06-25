## 1. Storage presigned-URL cache

- [x] 1.1 Add `getCachedR2PresignedGetUrl` in `src/lib/storage/r2.ts` with module-level TTL cache (3300 s buffer before 3600 s presign expiry)
- [x] 1.2 Export cached getter from `src/lib/storage/index.ts` as `getCachedAudioUrl` (R2 path only; local driver delegates to existing `getLocalAudioUrl`)

## 2. List API optimization

- [x] 2.1 Update `speechPublications.list` in `src/trpc/routers/speech-publications.ts` to presign from snapshot `thumbnailR2ObjectKey` without `objectExists`
- [x] 2.2 Use `getCachedAudioUrl` for list thumbnail resolution; keep timing segments (`presign` only, no `exists`)

## 3. Validation

- [x] 3.1 Run TypeScript check / lint on touched files
