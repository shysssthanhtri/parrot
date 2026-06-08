## Why

Long scripts are sent to Chatterbox as a single `prompt` in `generateSpeechAudio`, but the Modal API enforces `max_length=5000` and the model can drop or skip content even below that limit. Users hear incomplete speech previews and saved audio that does not match the full script. Splitting text into safe chunks, synthesizing each chunk, and concatenating the WAV in Parrot restores faithful full-script audio without changing the CMS client contract.

## What Changes

- Add a **text chunking utility** that splits script content into segments at natural boundaries (paragraphs, sentences) under a configurable character limit aligned with the Chatterbox API cap (5000)
- Add a **WAV concatenation utility** that merges multiple Chatterbox `audio/wav` responses into one buffer with consistent format
- Extend the **Chatterbox generate layer** with a long-text helper that chunks, calls `POST /generate` per chunk (sequentially), and returns a single combined `Buffer`
- Update **`generateSpeechAudio`** in the speeches tRPC router to use the long-text path so `speeches.generatePreview` returns complete audio for long scripts
- Add **unit tests** for chunking boundaries and WAV concatenation

## Capabilities

### New Capabilities

- `speech-text-chunking`: Split script text into TTS-safe chunks and concatenate multiple WAV buffers into one output

### Modified Capabilities

- `speeches`: Speech preview generation SHALL synthesize the full script via chunked TTS when content exceeds a single-request safe limit
- `chatterbox-api-client`: Generate speech helper SHALL support long prompts by orchestrating chunked requests and merged audio output

## Impact

- **Code**: `src/lib/chatterbox/generate.ts`, new `src/lib/speech-text-chunking.ts` and `src/lib/wav-concat.ts` (or equivalent), `src/trpc/routers/speeches.ts`, unit tests under `src/lib/`
- **APIs**: No tRPC input/output shape changes; `speeches.generatePreview` still returns `{ audioBase64 }`
- **Dependencies**: Possibly a small WAV parsing helper; no Modal or OpenAPI schema changes
- **Systems**: More Chatterbox `POST /generate` calls for long scripts (one per chunk, sequential); longer preview latency proportional to chunk count
