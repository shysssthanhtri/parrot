## Context

Speech preview generation (`src/trpc/routers/speeches.ts` → `generateSpeechAudio`) passes the entire `script.content` as a single Chatterbox `prompt`. The Modal service validates `prompt` with `max_length=5000` (`modal/chatterbox_tts.py`, `openapi/chatterbox.openapi.json`). In practice, long prompts can produce incomplete audio—content is skipped or truncated in the synthesized WAV. The CMS client already uploads preview audio via `speeches.getUploadUrl` + client PUT, so fixing synthesis server-side restores full-script previews without API contract changes.

Current flow:

```
speeches.generatePreview → generateSpeechAudio → generateSpeech({ prompt: full script })
```

## Goals / Non-Goals

**Goals:**

- Synthesize the **full script text** for `speeches.generatePreview` regardless of length
- Split text into chunks that respect the Chatterbox 5000-character API cap with margin for reliable model behavior
- Prefer **natural boundaries** (paragraphs, sentences) to avoid mid-word cuts
- **Concatenate** per-chunk WAV responses into one valid output buffer
- Keep chunking and WAV utilities **pure and unit-testable** (no network in chunk/concat modules)
- Preserve existing tRPC response shape (`{ audioBase64 }`)

**Non-Goals:**

- Changing the Modal Chatterbox service or OpenAPI schema
- Parallel chunk requests (sequential is simpler and avoids GPU contention surprises)
- Cross-fade or silence padding between chunks (hard join is acceptable for v1)
- Client-side chunking or multi-file upload
- Retries, caching, or progress streaming for multi-chunk generation

## Decisions

### Chunk size: 4000 characters default

Use `CHATTERBOX_PROMPT_MAX_CHARS = 4000` as the chunking limit—below the API hard cap of 5000 to leave headroom for model stability and future API tightening.

**Alternative:** Use 5000 exactly — rejected; observed skipping happens near the limit and margin improves reliability.

**Alternative:** Token-based splitting — rejected; Chatterbox API is character-based and scripts are plain text.

### Chunking algorithm: greedy boundary scan

Implement `splitTextForTts(text, maxChars)` in `src/lib/speech-text-chunking.ts`:

1. Trim input; if `length <= maxChars`, return `[text]`
2. Walk forward, accumulating text up to `maxChars`
3. Within the window, prefer the latest break at (in order):
   - `\n\n` (paragraph)
   - `\n` (line)
   - sentence end: `. `, `! `, `? `, `。`, etc. (include common CJK closing punctuation for script languages)
4. If no boundary found, hard-split at `maxChars`
5. Repeat on remainder until exhausted

Export `CHATTERBOX_PROMPT_MAX_CHARS` constant for tests and the long-text helper.

**Alternative:** Split only on `\n\n` — rejected; scripts may be one long paragraph.

### WAV concatenation: parse RIFF headers, join PCM

Implement `concatWavBuffers(buffers: Buffer[])` in `src/lib/wav-concat.ts`:

- Parse each buffer's `fmt` chunk (sample rate, channels, bits per sample)
- Verify all segments match; throw if not
- Take the header from the first buffer, concatenate raw PCM data from all segments, rewrite `data` chunk size and RIFF chunk size fields
- Return single `Buffer`

No new npm dependency if standard PCM WAV parsing covers Chatterbox output (16-bit mono/stereo). If Chatterbox returns non-standard WAV (e.g. extra chunks), the parser SHALL skip unknown chunks until `data`.

**Alternative:** Add `wavefile` package — acceptable fallback if hand-rolled parser is fragile; prefer zero-dep first.

**Alternative:** Re-encode via ffmpeg — rejected; heavy operational dependency for a server helper.

### Long-text orchestration in Chatterbox module

Add `generateLongSpeech` in `src/lib/chatterbox/generate.ts`:

```ts
export async function generateLongSpeech(
  params: Omit<TTSRequest, "prompt"> & { prompt: string }
): Promise<Buffer>;
```

1. `const chunks = splitTextForTts(params.prompt, CHATTERBOX_PROMPT_MAX_CHARS)`
2. If `chunks.length === 1`, delegate to existing `generateSpeech`
3. Otherwise, loop sequentially: `generateSpeech({ ...params, prompt: chunk })`
4. `return concatWavBuffers(audioBuffers)`

Keep existing `generateSpeech` unchanged for single-chunk callers.

### Speeches router integration

Update `generateSpeechAudio` to call `generateLongSpeech` instead of `generateSpeech`. No changes to `speeches.create` (client uploads pre-generated preview).

### Error handling

- Empty script after trim → let Chatterbox return 422 (unchanged behavior)
- Any chunk failure → throw immediately; do not return partial audio
- WAV format mismatch between chunks → throw with descriptive error (should not happen with same model/params)

## Risks / Trade-offs

| Risk                                                      | Mitigation                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| Audible seams between chunks                              | Accept for v1; natural sentence boundaries reduce perceived gaps |
| Longer preview latency (N sequential API calls)           | Expected; document in CMS if needed later                        |
| WAV format assumptions break if Chatterbox output changes | Unit tests with fixture buffers; validate fmt chunk fields       |
| Hard-split mid-word sounds unnatural                      | Rare edge case; only when single token exceeds limit             |
| Partial failure wastes earlier chunk API calls            | Acceptable; no partial return per spec                           |

## Migration Plan

1. Implement utilities and tests
2. Wire `generateLongSpeech` into `generateSpeechAudio`
3. Manually verify short and long script previews in CMS
4. No DB migration, env changes, or deployment ordering constraints
5. Rollback: revert router to `generateSpeech` single-call path

## Open Questions

- None for v1. Optional follow-up: configurable inter-chunk silence or parallel chunk requests with ordered merge.
