## Why

Long-text TTS splits scripts into multiple chunks and concatenates the resulting WAV buffers back-to-back. Without a pause between chunks, speech runs together unnaturally—especially at sentence and paragraph boundaries where the listener expects a brief breath. Script-sync alignment (Option B) also assumes chunk boundaries match audible transitions; abrupt joins make highlights feel early or late relative to what the ear hears.

## What Changes

- Insert a configurable silence gap between consecutive chunk WAVs when concatenating multi-chunk speech
- Extend `concatWavBuffers` (or a dedicated join helper) to accept an optional gap duration in milliseconds
- Update `generateLongSpeech` alignment capture so segment `startMs`/`endMs` include inter-chunk gaps (segments remain contiguous; gaps sit between segment end and next segment start)
- Add unit tests for silence insertion and alignment timing with gaps
- Single-chunk generation is unchanged (no gap inserted)

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `speech-script-alignment`: Multi-chunk alignment timing SHALL account for inter-chunk silence gaps in cumulative `startMs`/`endMs`
- `chatterbox-api-client`: Long-text generation SHALL concatenate chunk WAVs with a silence gap between consecutive chunks

## Impact

- **Code**: `src/lib/wav-concat.ts` (silence PCM generation, gap-aware concat), `src/lib/chatterbox/generate.ts` (alignment offset includes gaps)
- **Downstream**: `SpeechScriptSyncViewer` and create/preview validation benefit automatically from corrected timing; no API contract changes
- **Data**: No migration; existing persisted speeches keep prior alignment; new previews and speeches use gap-aware timing
- **Systems**: No external service changes; final WAV files are slightly longer by `(chunks - 1) × gapMs`
