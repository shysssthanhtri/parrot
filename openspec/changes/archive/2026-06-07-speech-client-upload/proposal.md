## Why

When saving a speech, the CMS currently sends the full preview WAV as base64 through tRPC. That inflates request payloads, adds server-side decode/upload work, and risks timeouts on larger audio. The preview audio is already on the client after `generatePreview`; uploading it directly to storage and passing only the object key keeps the save request small and aligns with how R2 is meant to be used.

## What Changes

- Add a server endpoint to issue a presigned upload URL (or equivalent local upload path) for speech audio at `speeches/{id}.wav`
- Update `speeches.create` to accept `r2ObjectKey` instead of optional `audioBase64`; server validates the object exists and persists the speech row without re-uploading audio
- Update the CMS create form save flow: upload preview WAV to storage first, then call `speeches.create` with the key
- Remove `audioBase64` from the create mutation input (**BREAKING** for any client still sending base64 on save)
- Keep `speeches.generatePreview` returning base64 for in-browser preview (unchanged)

## Capabilities

### New Capabilities

_None — this extends existing speech and storage behavior rather than introducing a new domain capability._

### Modified Capabilities

- `speeches`: Create API accepts a storage key for pre-uploaded audio instead of base64; add presigned upload URL procedure for client-side upload before save
- `cms-speeches`: Save flow uploads preview audio to storage before calling create with the object key

## Impact

- `src/lib/storage/` — presigned PUT URL helper (R2) and local upload URL for dev
- `src/trpc/routers/speeches.ts` — new `getUploadUrl` (or similar) procedure; `create` input and handler changes
- `src/app/(cms)/cms/speeches/_components/speech-create-form.tsx` — two-step save (upload then create)
- `openspec/specs/speeches/spec.md` and `openspec/specs/cms-speeches/spec.md` — requirement updates via delta specs
