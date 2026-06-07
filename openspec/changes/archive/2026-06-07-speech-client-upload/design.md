## Context

Speech creation today works in two steps on the client: `speeches.generatePreview` returns WAV as base64 for the waveform player, then `speeches.create` accepts that same base64 (`audioBase64`) so the server decodes it and uploads via `uploadObject` to `speeches/{id}.wav`. Preview payloads can be several MB once base64-encoded, which travels through the Next.js/tRPC stack twice (preview response + create request).

The project already has a storage abstraction (`src/lib/storage/`) with R2 presigned GET URLs (`getR2PresignedGetUrl`) and local filesystem storage for development. There is no presigned PUT helper yet.

## Goals / Non-Goals

**Goals:**

- Client uploads preview WAV directly to storage before save
- `speeches.create` accepts `r2ObjectKey` (and `id` matching the upload key) instead of `audioBase64`
- Server validates the uploaded object exists and matches expected key format before persisting
- Local dev (`STORAGE_DRIVER=local`) uses an authenticated upload path so the same client flow works without R2

**Non-Goals:**

- Changing `speeches.generatePreview` (still returns base64 for in-browser preview)
- Presigned upload for voice samples or other entities
- Server-side re-generation on save (client must upload the preview it intends to save)
- Orphan object cleanup / lifecycle policies for failed saves

## Decisions

### Two-step save flow

1. Client calls `speeches.getUploadUrl` with no input (or optional content type) → server returns `{ speechId, r2ObjectKey, uploadUrl, method }` where `r2ObjectKey` is `speeches/{speechId}.wav` and `speechId` is a new UUID.
2. Client `PUT`s the preview WAV bytes to `uploadUrl` with `Content-Type: audio/wav`.
3. Client calls `speeches.create` with TTS params plus `id` and `r2ObjectKey` from step 1.

**Alternative:** Single `create` that returns presigned URL and expects a follow-up confirm — rejected; explicit `getUploadUrl` keeps upload and DB insert separate and mirrors a clear client state machine.

**Alternative:** Keep server upload as fallback when `audioBase64` is sent — rejected; user asked to move off base64 on save; one path reduces complexity.

### Presigned PUT for R2

Add `getR2PresignedPutUrl(key, contentType, expiresIn)` in `src/lib/storage/r2.ts`, exported via `getUploadUrl(key, contentType)` in `src/lib/storage/index.ts`. Reuse the same 1-hour TTL as GET presigns.

**Alternative:** Multipart upload — rejected; speech WAVs are small enough for single PUT.

### Local storage upload in development

When `STORAGE_DRIVER=local`, `speeches.getUploadUrl` returns `uploadUrl: /api/storage/upload` (or a dedicated route) with `method: PUT` and the target `r2ObjectKey` in the body or query. The route writes to `.local-storage/{key}` using existing `uploadLocalObject`. This avoids needing R2 credentials locally while keeping the client upload code path identical (fetch PUT to returned URL).

**Alternative:** Server-side upload in local only — rejected; divergent client flows are harder to test.

### Create validation

`speeches.create` input:

- Required `id` (UUID) and `r2ObjectKey` matching `speeches/{id}.wav`
- Same voice/script/language/TTS fields as today
- No `audioBase64`

Before insert, server calls `readLocalObject` / R2 `HeadObject` (add lightweight `objectExists` helper) to confirm the object is present. Reject with `BAD_REQUEST` if missing or key format invalid. Use the provided `id` as the speech primary key (today server generates UUID at create time — move generation to `getUploadUrl`).

**Alternative:** Trust client without existence check — rejected; prevents saving rows pointing at missing objects.

### Preview vs saved audio

The client uploads the same bytes it received from `generatePreview`. The server does not re-run Chatterbox on create. If the user changes sliders after preview without regenerating, save remains disabled (existing `canSave` / `previewConfigKey` behavior).

**Alternative:** Server regenerate on save — original v1 design; rejected here because upload-first flow means audio is already on the client and re-generation adds latency and Modal cost.

## Risks / Trade-offs

- **[Orphan R2 objects]** User gets upload URL but never calls create → Mitigation: acceptable for v1; optional future cleanup job for `speeches/*` without DB row
- **[Stale preview saved]** User could upload old preview bytes → Mitigation: existing `previewConfigKey` gate on save button; document that save requires current preview
- **[CORS on R2 PUT]** Browser direct upload may need R2 bucket CORS rules → Mitigation: configure R2 CORS for PUT from CMS origin; document in README/Makefile if needed
- **[Breaking API]** Removing `audioBase64` from create → Mitigation: only CMS client exists today; deploy API and UI together

## Migration Plan

1. Ship storage helpers and `speeches.getUploadUrl`
2. Update `speeches.create` to require `id` + `r2ObjectKey`; remove `audioBase64` and server-side `uploadObject` on create
3. Update `speech-create-form.tsx` save handler
4. Configure R2 CORS if not already set for PUT
5. No database migration required (`Speech` model unchanged)

Rollback: revert client to previous version alongside API that still accepts `audioBase64` (would require temporarily keeping both inputs).

## Open Questions

- Whether R2 bucket CORS is already configured for browser PUT from the CMS domain (verify during implementation)
- Whether to add `HeadObject` vs `GetObject` with range for existence check (prefer Head for cost)
