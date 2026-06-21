## 1. WAV concatenation with gap

- [x] 1.1 Export `CHUNK_JOIN_GAP_MS = 400` from `src/lib/wav-concat.ts`
- [x] 1.2 Add `createSilencePcm(format, gapMs)` helper that returns zero-filled PCM sized from sample rate and block align
- [x] 1.3 Extend `concatWavBuffers(buffers, gapMs?)` to insert silence PCM between consecutive chunks when `gapMs > 0` and `buffers.length > 1`; default `gapMs = 0` preserves existing behavior

## 2. Long-speech generation and alignment

- [x] 2.1 Update `generateLongSpeech` to pass `CHUNK_JOIN_GAP_MS` to `concatWavBuffers` for multi-chunk paths
- [x] 2.2 Update alignment accumulation so each non-final segment's `endMs` includes the trailing gap (`startMs + durationMs + gapMs`); single-chunk path unchanged
