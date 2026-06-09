## Why

Speech preview and detail pages play generated audio but do not show the script text, so CMS users cannot follow along while listening. A karaoke-style experience—script text progressing in sync with the voice—makes it easier to review pacing, verify content, and catch synthesis issues. Chunk-level timing (Option B) piggybacks on the existing TTS chunking pipeline for accurate sentence boundaries without a forced-alignment dependency.

## What Changes

- Capture **chunk-level audio–text alignment** during TTS generation: each `splitTextForTts` segment gets exact `startMs` / `endMs` from per-chunk WAV duration before concatenation
- Persist alignment on saved speeches and return it from preview/detail APIs so the mapping is reusable outside the CMS
- Add a **shared synchronized script viewer** component: past chunks dimmed, active chunk highlighted, upcoming chunks normal; driven by the audio player's `currentTime`
- Integrate the viewer on **speech create** (preview card) and **speech detail** (alongside waveform player)
- Extend `speeches.generatePreview` to return alignment alongside audio; extend `speeches.create` to accept and store alignment; extend `speeches.getById` to return alignment and script content
- Document **Option C** (forced alignment) and **Option D** (native TTS timestamps) in design for future consideration

## Capabilities

### New Capabilities

- `speech-script-alignment`: Chunk-level audio–text timing capture during TTS generation, persistence, and a reusable alignment data shape for CMS and future end-user surfaces

### Modified Capabilities

- `cms-speeches`: Speech create preview and speech detail pages SHALL display synchronized script text alongside the waveform player
- `speeches`: Preview, create, and detail APIs SHALL produce, persist, and return chunk alignment metadata

## Impact

- **Code**: `src/lib/chatterbox/generate.ts`, `src/lib/wav-concat.ts` (or new duration helper), `src/trpc/routers/speeches.ts`, new shared alignment types/utilities, new `ScriptSyncViewer` (or equivalent) component, `speech-detail.tsx`, `speech-create-form.tsx`, `VoiceAudioPreview` (lift `currentTime` / seek callback for sync)
- **Database**: Prisma migration adding alignment JSON column on `Speech` (or equivalent storage field)
- **APIs**: `speeches.generatePreview` returns `{ audioBase64, alignment }`; `speeches.create` accepts `alignment`; `speeches.getById` returns `alignment` and script `content`
- **Dependencies**: No new npm packages for v1 (WAV duration from existing parser)
- **Systems**: No Modal/Chatterbox changes; alignment computed server-side during existing chunk loop
