## Context

Speech preview (`/cms/speeches/new`) and detail (`/cms/speeches/[speechId]`) pages render a WaveSurfer-based audio player (`VoiceAudioPreview`) but do not display script text. Users hear the voice without visual context.

TTS generation already splits long scripts into chunks via `splitTextForTts` and synthesizes each chunk separately before concatenating WAV output (`generateLongSpeech`). Chatterbox returns audio only—no word or phoneme timestamps. The chunk loop is the natural hook for Option B: record each chunk's duration and map it to the chunk's text.

Current flow:

```
speeches.generatePreview
  → generateSpeechAudio
    → generateLongSpeech
      → splitTextForTts → [chunk₁, chunk₂, …]
      → generateSpeech per chunk → [wav₁, wav₂, …]
      → concatWavBuffers → single WAV
```

Target flow adds alignment capture in the same loop and surfaces it through APIs and a shared UI component usable in CMS today and end-user apps later.

## Goals / Non-Goals

**Goals:**

- Capture **chunk-level alignment** (`text`, `startMs`, `endMs`) during TTS generation with exact boundaries at chunk joins
- Define a **stable, reusable alignment shape** (`SpeechScriptAlignment`) shared by preview, create, detail, and future consumer surfaces
- Persist alignment on saved `Speech` rows so detail pages work without re-generation
- Build a **shared synchronized script viewer**: past chunks dimmed, active chunk highlighted, upcoming normal; driven by audio `currentTime`
- Integrate viewer on **speech create preview** and **speech detail** alongside the existing waveform player
- Auto-scroll (or scroll-into-view) so the active chunk stays visible during playback

**Non-Goals:**

- Word-level or character-level highlight (sentence/chunk granularity only for v1)
- Forced alignment post-processing (Option C) or switching TTS provider for native timestamps (Option D)
- Backfilling alignment for speeches saved before this change
- Click-to-seek on individual chunks (optional follow-up; waveform scrubbing still updates highlight)
- End-user-facing app UI (alignment API shape is designed for reuse, but no consumer app work in this change)
- Changing Modal/Chatterbox service or OpenAPI schema

## Decisions

### Alignment granularity: TTS chunk (sentence-biased)

Each alignment segment corresponds to one `splitTextForTts` chunk—the same text sent to Chatterbox for one `POST /generate` call. Chunks prefer period/sentence boundaries, so segments read as sentences or short paragraph groups.

**Alternative:** Linear time proportional to character count — rejected; drifts badly within chunks.

**Alternative:** Word-level via forced alignment — deferred to Option C (see Future Considerations).

### Alignment data shape

```ts
type SpeechAlignmentSegment = {
  text: string; // chunk text as synthesized (trimmed)
  startMs: number; // inclusive, integer milliseconds
  endMs: number; // exclusive, integer milliseconds
};

type SpeechScriptAlignment = {
  version: 1;
  segments: SpeechAlignmentSegment[];
};
```

- `version` allows future format evolution (e.g. word-level segments under Option C)
- Segments are ordered, contiguous, and cover `[0, totalDurationMs)` with no gaps
- Export types from a shared module (e.g. `src/lib/speech-script-alignment.ts`) for server and client

**Alternative:** Store only `{ startMs, endMs }[]` and derive text from script — rejected; chunks must match what was actually synthesized (chunk boundaries may differ from naive script split if generation params change).

### Capture timing during `generateLongSpeech`

Extend the long-speech helper to return `{ audio: Buffer; alignment: SpeechScriptAlignment }`:

1. `const chunks = splitTextForTts(params.prompt, CHATTERBOX_PROMPT_MAX_CHARS)`
2. For each chunk, call `generateSpeech` → measure WAV duration via existing WAV parser (`parseWav` / new `getWavDurationMs`)
3. Accumulate `startMs` / `endMs` per chunk
4. `concatWavBuffers` as today for the combined audio

Add `getWavDurationMs(buffer: Buffer): number` alongside existing WAV utilities—derive from PCM byte length and sample rate rather than adding a dependency.

**Alternative:** Estimate duration from `audio.length / byteRate` — acceptable if parser already exposes byteRate; prefer sample-accurate calculation from PCM data length.

### Persistence: JSON column on `Speech`

Add `alignment Json?` (or `Json` with non-null default empty) on the Prisma `Speech` model. Store `SpeechScriptAlignment` at create time.

**Alternative:** Sidecar R2 object (`speeches/{id}.alignment.json`) — rejected for v1; extra fetch and upload step; DB column keeps `getById` single-round-trip.

**Alternative:** Recompute on detail from script + audio — rejected; requires audio analysis or re-chunking without guaranteed match to generation-time splits.

### API changes

| Procedure                  | Change                                                                       |
| -------------------------- | ---------------------------------------------------------------------------- |
| `speeches.generatePreview` | Return `{ audioBase64, alignment }`                                          |
| `speeches.create`          | Accept required `alignment` matching preview; validate shape; persist on row |
| `speeches.getById`         | Return `alignment` and `script.content` for viewer                           |

Validation on create:

- `alignment.version === 1`
- `segments.length >= 1`
- Segments contiguous: `segments[0].startMs === 0`, each `segments[i].endMs === segments[i+1].startMs`
- Last segment `endMs` roughly matches audio duration (allow small tolerance for rounding)
- Segment texts concatenate to trimmed script content (order-preserving; whitespace normalization rules documented in Zod schema)

Preview alignment is authoritative for the preview audio; client passes the same alignment object to `create` after upload.

### Shared UI: `SpeechScriptSyncViewer`

New client component in a shared location (e.g. `src/components/speech-script-sync-viewer.tsx` or under `src/app/(cms)/cms/speeches/_components/` if CMS-only initially—prefer shared path for end-user reuse).

Props:

- `alignment: SpeechScriptAlignment`
- `currentTimeMs: number` (from WaveSurfer `currentTime * 1000`)

Behavior:

- Resolve active segment: first where `startMs <= t < endMs`
- Render each segment as a block; apply classes: past → `text-muted-foreground`, active → highlighted (e.g. `bg-accent text-accent-foreground` or primary tint), upcoming → default foreground
- Auto-scroll active segment into view (`scrollIntoView({ block: "nearest", behavior: "smooth" })`) on segment change

### Audio player integration

Extend `VoiceAudioPreview` (or wrap it) to expose playback time to parent:

- Callback prop `onTimeUpdate?(currentTimeMs: number)` fired during playback and on seek
- Parent composes: `[SpeechScriptSyncViewer]` above or beside `[VoiceAudioPreview]`

Used on:

- `speech-create-form.tsx` — when preview is shown, pass alignment from `generatePreview` response
- `speech-detail.tsx` — when audio and alignment exist, pass alignment from `getById`

If alignment is null (legacy speeches), show script content without sync styling or hide sync viewer and show static script text with a note—prefer static full script display for legacy rows.

### Create flow: pass alignment through save

1. User generates preview → receives `{ audioBase64, alignment }`
2. Client keeps alignment in state alongside preview blob
3. On save: upload WAV, call `speeches.create` with `alignment`
4. Regenerate clears and replaces alignment with new preview response

## Future Considerations

Documented for later evaluation—not in scope for this change.

### Option C: Forced alignment (post-generation)

After WAV is produced, run a forced aligner (e.g. WhisperX, Bournemouth Forced Aligner) with the known script text to derive word- or phoneme-level `{ text, startMs, endMs }` timestamps.

| Pros                                                | Cons                                                   |
| --------------------------------------------------- | ------------------------------------------------------ |
| Accurate word-level karaoke, click-to-seek on words | Extra compute pipeline (Modal job or server worker)    |
| Works with existing Chatterbox audio                | Added latency on every preview/save                    |
| No TTS provider change                              | Multilingual quality varies; must re-run on regenerate |
|                                                     | Storage grows; migration from v1 chunk alignment       |

**When to consider:** Users need word-perfect sync, lip-sync, or interactive word seeking. Could extend `SpeechScriptAlignment` to `version: 2` with nested word segments per chunk or flat word list.

### Option D: Native TTS timestamps

Switch or supplement Chatterbox with a TTS API that returns word/phoneme timestamps inline (e.g. Hume Octave, Inworld, ElevenLabs with alignment).

| Pros                                              | Cons                                                         |
| ------------------------------------------------- | ------------------------------------------------------------ |
| Timestamps at generation time, no post-processing | Requires TTS stack change or dual-provider support           |
| Highest accuracy, streaming-friendly              | May lose Chatterbox voice cloning / current Modal deployment |
|                                                   | Cost, latency, and API contract differences                  |

**When to consider:** Re-evaluating TTS provider anyway, or adding a premium tier with native alignment. Option B chunk data could coexist as fallback.

## Risks / Trade-offs

| Risk                                                        | Mitigation                                                                                       |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Highlight lags slightly behind audio within a long chunk    | Sentence-biased chunks (~400 chars max) bound drift; acceptable for CMS review                   |
| Legacy speeches have no alignment                           | Show static script text; no sync highlight                                                       |
| Client passes stale alignment after regenerate-without-save | Create validates segment text against script; preview state tracks config key (existing pattern) |
| WAV duration rounding vs wall-clock playback                | Use integer ms from PCM length; last segment ends at total duration                              |
| Alignment module coupled to CMS paths                       | Shared types + viewer in neutral module path                                                     |

## Migration Plan

1. Add Prisma `alignment` column (nullable for legacy rows)
2. Deploy server changes (generate returns alignment; create accepts it)
3. Deploy client (viewer on create + detail)
4. No backfill; existing speeches show static script or no sync
5. Rollback: nullable column safe; client hides sync if alignment missing

## Open Questions

- None blocking v1. Follow-ups: click chunk to seek, backfill job for legacy speeches, Option C spike.
