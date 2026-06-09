## 1. WAV concatenation with gap

- [x] 1.1 Export `CHUNK_JOIN_GAP_MS = 400` from `src/lib/wav-concat.ts`
- [x] 1.2 Add `createSilencePcm(format, gapMs)` helper that returns zero-filled PCM sized from sample rate and block align
- [x] 1.3 Extend `concatWavBuffers(buffers, gapMs?)` to insert silence PCM between consecutive chunks when `gapMs > 0` and `buffers.length > 1`; default `gapMs = 0` preserves existing behavior

## 2. Long-speech generation and alignment

- [x] 2.1 Update `generateLongSpeech` to pass `CHUNK_JOIN_GAP_MS` to `concatWavBuffers` for multi-chunk paths
- [x] 2.2 Update alignment accumulation so each non-final segment's `endMs` includes the trailing gap (`startMs + durationMs + gapMs`); single-chunk path unchanged

## 3. Unit tests

- [x] 3.1 Add `src/lib/wav-concat.test.ts`: two-chunk concat with gap produces longer output than without gap by approximately `gapMs`
- [x] 3.2 Add test: single-buffer concat ignores gap parameter
- [x] 3.3 Add test (or inline in generate tests): multi-chunk alignment segment boundaries include gap in cumulative timing

## 4. Verification

- [x] 4.1 Run unit tests and confirm all pass
- [ ] 4.2 Manual CMS check: generate preview on a multi-chunk script and confirm audible pause between chunks and sync highlight holds through the pause
