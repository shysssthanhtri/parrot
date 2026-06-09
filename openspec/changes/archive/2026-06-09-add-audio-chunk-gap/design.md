## Context

`generateLongSpeech` synthesizes each `splitTextForTts` chunk via Chatterbox, measures per-chunk WAV duration, builds chunk-level alignment (`SpeechScriptAlignment`), and joins buffers with `concatWavBuffers`. Today concatenation is immediate back-to-back PCM with no pause. Multi-chunk speech sounds rushed at boundaries, and the sync viewer highlights jump to the next chunk the instant the previous chunk's audio ends—even though a natural pause would still belong visually to the prior sentence.

Current flow:

```
chunks → [wav₁, wav₂, …] → concatWavBuffers (no gap) → final WAV
         alignment: segmentᵢ.endMs = segmentᵢ₊₁.startMs (abutted)
```

## Goals / Non-Goals

**Goals:**

- Insert a brief silence gap between consecutive chunk WAVs when joining multi-chunk speech
- Keep alignment segments contiguous and covering the full audio duration (Option B compatible)
- Extend each non-final segment's `endMs` to include the trailing inter-chunk silence so the prior chunk stays highlighted during the pause
- Export a named constant for the default gap duration
- Add unit tests for PCM silence insertion and alignment timing

**Non-Goals:**

- Per-boundary dynamic gaps (paragraph vs sentence vs line)—single fixed gap for v1
- Re-generating or backfilling alignment on existing speeches
- Client-side gap configuration or CMS UI for gap length
- Changing Chatterbox API or chunking logic

## Decisions

### Fixed default gap: 400 ms

Use `CHUNK_JOIN_GAP_MS = 400` as the default inter-chunk silence duration. 400 ms is a natural sentence pause—long enough to be audible, short enough to avoid sluggish pacing on scripts with many chunks.

**Alternative:** 200 ms — rejected; often imperceptible on fast playback.

**Alternative:** 800 ms+ — rejected; feels sluggish for dense multi-chunk scripts.

**Alternative:** Env-configurable gap — deferred; constant keeps v1 simple; can promote to env later if needed.

### Silence as zero-filled PCM in `concatWavBuffers`

Extend `concatWavBuffers(buffers, gapMs?)` to insert a silence PCM segment between consecutive parsed chunk buffers when `gapMs > 0` and `buffers.length > 1`. Silence is derived from the first buffer's format (`sampleRate`, `numChannels`, `bitsPerSample`, `blockAlign`): frame count = `round(sampleRate * gapMs / 1000)`, byte length = `frameCount * blockAlign`, filled with zeros.

No gap after the final chunk. Single-buffer input returns unchanged (no gap).

**Alternative:** Insert silence in `generateLongSpeech` by pushing synthetic WAV buffers — rejected; duplicates format logic; `wav-concat` already owns PCM assembly.

**Alternative:** Fade/crossfade between chunks — rejected; adds complexity; silence is sufficient for v1.

### Alignment: trailing silence included in segment `endMs`

To preserve contiguous segments with no timeline holes (per `speech-script-alignment` spec), each non-final segment's `endMs` includes the trailing inter-chunk gap:

```
segment[i].startMs = sum(duration[0..i-1]) + (i × gapMs)
segment[i].endMs   = segment[i].startMs + duration[i] + (i < last ? gapMs : 0)
```

Equivalently during accumulation in `generateLongSpeech`:

1. Synthesize chunk → measure `durationMs`
2. Push segment `{ text, startMs, endMs: startMs + durationMs + gapMs }` (use `+ gapMs` only when not last chunk)
3. Advance `startMs = endMs`

The sync viewer keeps the prior chunk highlighted during the pause—matching listener expectation.

**Alternative:** Allow gaps between segments with no active highlight — rejected; requires spec change and ambiguous UX during silence.

### Constant exported from `wav-concat`

Export `CHUNK_JOIN_GAP_MS` from `src/lib/wav-concat.ts` alongside `concatWavBuffers` so `generateLongSpeech` and tests share one source of truth.

## Risks / Trade-offs

| Risk                                                                     | Mitigation                                                        |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Final WAV longer by `(n-1) × gapMs`                                      | Expected; only affects multi-chunk scripts                        |
| Highlight stays on previous chunk during gap                             | Intentional; segment owns trailing silence                        |
| Rounding silence frame count vs alignment ms                             | Use same `gapMs` integer for both PCM length and alignment offset |
| Existing speeches have shorter audio / different alignment               | No migration; regenerate preview for updated timing               |
| `concatWavBuffers` callers other than long-speech get new optional param | Default `gapMs = 0` preserves current behavior for other callers  |

## Migration Plan

Code-only deploy. No database migration. Existing persisted speeches unchanged. New previews and saves use gap-aware audio and alignment.

## Open Questions

- None blocking. Optional follow-up: tiered gaps by chunk boundary type (paragraph vs sentence).
