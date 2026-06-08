## 1. Text chunking utility

- [x] 1.1 Create `src/lib/speech-text-chunking.ts` with `CHATTERBOX_PROMPT_MAX_CHARS` (4000) and `splitTextForTts(text, maxChars?)` implementing paragraph → sentence → hard-split priority
- [x] 1.2 Export chunking helpers from a sensible module path (direct file or `src/lib/chatterbox/` barrel if preferred)

## 2. WAV concatenation utility

- [x] 2.1 Create `src/lib/wav-concat.ts` with `concatWavBuffers(buffers: Buffer[])` that validates matching fmt metadata and returns a single valid WAV
- [x] 2.2 Handle single-buffer passthrough and throw on incompatible formats

## 3. Long-text Chatterbox helper

- [x] 3.1 Add `generateLongSpeech` to `src/lib/chatterbox/generate.ts` that chunks the prompt, calls `generateSpeech` sequentially per chunk, and concatenates results
- [x] 3.2 Short-circuit to `generateSpeech` when text fits in one chunk
- [x] 3.3 Re-export `generateLongSpeech` from `src/lib/chatterbox/index.ts`

## 4. Speeches router integration

- [x] 4.1 Update `generateSpeechAudio` in `src/trpc/routers/speeches.ts` to call `generateLongSpeech` instead of `generateSpeech`

## 5. Tests and verification

- [ ] 5.1 Add unit tests for `splitTextForTts` (short text, sentence splits, paragraph preference, hard-split edge case)
- [ ] 5.2 Add unit tests for `concatWavBuffers` (single buffer passthrough, two-segment concat, format mismatch error) using small fixture WAV buffers
- [ ] 5.3 Confirm `pnpm typecheck` passes
- [ ] 5.4 Manual test: generate preview for a short script (single chunk) and a long script (>4000 chars) in CMS; verify full content is audible
