## 1. Alignment types and WAV duration

- [x] 1.1 Create `src/lib/speech-script-alignment.ts` with `SpeechAlignmentSegment`, `SpeechScriptAlignment`, active-segment resolver, and Zod schema for validation
- [x] 1.2 Add `getWavDurationMs(buffer: Buffer)` to `src/lib/wav-concat.ts` (or adjacent WAV helper) using existing WAV parser

## 2. Capture alignment during TTS generation

- [x] 2.1 Extend `generateLongSpeech` in `src/lib/chatterbox/generate.ts` to return `{ audio: Buffer; alignment: SpeechScriptAlignment }` by measuring each chunk WAV duration before concatenation
- [x] 2.2 Update `generateSpeechAudio` in `src/trpc/routers/speeches.ts` to propagate alignment from the long-speech helper

## 3. Database and API

- [x] 3.1 Add nullable `alignment Json` field to Prisma `Speech` model and create migration
- [x] 3.2 Extend `speeches.generatePreview` to return `{ audioBase64, alignment }`
- [x] 3.3 Extend `speeches.create` input with required `alignment`; validate shape and script consistency; persist on create
- [x] 3.4 Extend `speeches.getById` to return `alignment` and script `content`

## 4. Shared synchronized script viewer

- [x] 4.1 Create `SpeechScriptSyncViewer` component: render segments with past/active/upcoming styling per design
- [x] 4.2 Auto-scroll active segment into view on segment change during playback
- [x] 4.3 Extend `VoiceAudioPreview` with `onTimeUpdate` callback (ms) for parent sync; ensure seek/scrub updates fire the callback

## 5. CMS integration

- [x] 5.1 Update `speech-create-form.tsx`: store preview alignment from `generatePreview`, pass to sync viewer and `speeches.create`, clear on regenerate
- [x] 5.2 Update `speech-detail.tsx`: show sync viewer with stored alignment and script content; fallback to static script text for legacy speeches without alignment
- [x] 5.3 Compose sync viewer above waveform player on both create preview and detail pages

## 6. Verification

- [ ] 6.1 Confirm `pnpm typecheck` passes
