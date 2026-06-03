## 1. Dependencies

- [x] 1.1 Add `wavesurfer.js` and `@wavesurfer/react` to project dependencies
- [x] 1.2 Run install and confirm build/lint still pass

## 2. Audio preview component

- [x] 2.1 Create `voice-audio-preview.tsx` client component with `"use client"`
- [x] 2.2 Wire `WavesurferPlayer` (or `useWavesurfer`) with `url` prop from presigned `audioUrl`
- [x] 2.3 Add play/pause button using shadcn `Button` and lucide icons
- [x] 2.4 Display elapsed/total time updated from WaveSurfer events
- [x] 2.5 Apply theme-aligned `waveColor` / `progressColor` via CSS variables
- [x] 2.6 Handle loading state while waveform decodes
- [x] 2.7 Handle error state with user-visible message (and optional open-in-tab fallback)
- [x] 2.8 Destroy/cleanup WaveSurfer instance on unmount

## 3. Integrate into voice detail

- [x] 3.1 Replace `<audio controls>` in `voice-detail.tsx` with `VoiceAudioPreview` when `audioUrl` is present
- [x] 3.2 Keep existing empty state when `r2ObjectKey` is null unchanged
- [x] 3.3 Verify server page still passes presigned URL only (no server component changes unless needed)

## 4. Verification

- [ ] 4.1 Manually test voice with audio: waveform renders, play/pause works, seek by clicking waveform
- [ ] 4.2 Manually test voice without `r2ObjectKey`: empty state, no errors
- [ ] 4.3 Confirm presigned URL still loads (CORS unchanged from prior behavior)
