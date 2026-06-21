## 1. Storage upload helpers

- [x] 1.1 Add `getR2PresignedPutUrl` in `src/lib/storage/r2.ts` with `Content-Type` and TTL matching GET presigns
- [x] 1.2 Add `objectExists` helper (R2 `HeadObject`, local `resolveLocalObjectPath`) in storage module
- [x] 1.3 Export `getSpeechUploadUrl(key)` from `src/lib/storage/index.ts` that returns presigned PUT for R2 or local upload URL for dev

## 2. Local upload route

- [x] 2.1 Add authenticated `PUT` handler at `/api/storage/upload` (or equivalent) that accepts `key` and WAV body and writes via `uploadLocalObject`
- [x] 2.2 Restrict accepted keys to `speeches/{uuid}.wav` pattern

## 3. tRPC speeches router

- [x] 3.1 Add `speeches.getUploadUrl` mutation returning `{ id, r2ObjectKey, uploadUrl, method }`
- [x] 3.2 Update `speeches.create` input: require `id` and `r2ObjectKey`, remove `audioBase64` and server-side `uploadObject` / `resolveSpeechAudio`
- [x] 3.3 Validate key format `speeches/{id}.wav` and call `objectExists` before `prisma.speech.create`
- [x] 3.4 Remove unused `decodePreviewAudio` and related create-path helpers if no longer referenced

## 4. CMS create form

- [x] 4.1 Add client helper to decode preview base64 to `Blob`/`ArrayBuffer` for upload
- [x] 4.2 Update `handleSave`: call `getUploadUrl` → `PUT` WAV to `uploadUrl` → `create` with `id` and `r2ObjectKey`
- [x] 4.3 Show combined loading state on save (upload + create) and surface errors via toast

## 5. R2 CORS and verification

- [x] 5.1 Document or configure R2 bucket CORS to allow `PUT` from the CMS origin
