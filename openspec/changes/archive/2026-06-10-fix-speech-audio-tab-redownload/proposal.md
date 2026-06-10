## Why

On the speech detail page, switching to another browser tab and returning causes the waveform audio preview to reload and re-download the full audio file. This happens because React Query refetches `speeches.getById` on window focus, and each response includes a freshly generated presigned URL. WaveSurfer treats the new URL as a different source and reloads the waveform from scratch, interrupting playback and wasting bandwidth.

## What Changes

- Stabilize the audio preview URL on the speech detail page so metadata refetches (window focus, polling while generating) do not replace the URL passed to the waveform player unless the underlying audio object actually changes.
- Disable unnecessary `refetchOnWindowFocus` for finished speeches while preserving polling during `pending` / `processing` and after retry.
- Preserve playback position and waveform state when the user briefly switches tabs during preview.

## Capabilities

### New Capabilities

_None — this is a UX fix for existing speech detail audio preview behavior._

### Modified Capabilities

- `cms-speeches`: Speech detail audio preview SHALL NOT re-download audio when the user returns to the tab after a metadata refetch that returns a new presigned URL for the same stored object.

## Impact

- **UI**: `src/app/(cms)/cms/speeches/[speechId]/_components/speech-detail-client.tsx` (query options and stable `audioUrl` handling); possibly `speech-script-playback-panel.tsx` or `voice-audio-preview.tsx` if URL stabilization is shared.
- **API**: No tRPC contract changes; presigned URLs still generated server-side on `speeches.getById`.
- **Unchanged**: R2 presigning, speech generation polling, script sync highlighting, voice detail page (server-rendered URL, no React Query refetch).
