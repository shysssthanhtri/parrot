## Why

The CMS voice detail page uses the browser’s native `<audio controls>` element, which offers minimal feedback for reviewing voice samples (no waveform, limited scrubbing affordance, inconsistent styling). Editors comparing voices need a clearer preview experience that matches the rest of the shadcn CMS UI and makes duration and playback position obvious at a glance.

## What Changes

- Replace the native HTML audio control on `/cms/voices/[voiceId]` with a client-side waveform player (WaveSurfer.js) when a presigned preview URL is available
- Show a visual waveform, play/pause control, seek-by-click on the waveform, and elapsed/total time
- Preserve existing behavior when `r2ObjectKey` is null (metadata + empty state, no player)
- Keep presigned URL generation server-side; no change to R2 or tRPC contracts
- Add `wavesurfer.js` as a dependency and a small reusable CMS audio preview component

## Capabilities

### New Capabilities

_None — this enhances an existing CMS surface without new domain capabilities._

### Modified Capabilities

- `cms-voices`: Update the audio preview requirement from native HTML `<audio>` to a waveform-based player with standard transport controls and seek interaction

## Impact

- **UI**: `src/app/(cms)/cms/voices/[voiceId]/_components/voice-detail.tsx` (extract or compose a client preview component)
- **Dependencies**: `wavesurfer.js` (and possibly a React wrapper or thin client wrapper)
- **Specs**: Delta under `openspec/changes/voice-detail-audio-preview/specs/cms-voices/`; main `openspec/specs/cms-voices/spec.md` updated on archive
- **Unchanged**: R2 presigning, voice data model, list page, auth
