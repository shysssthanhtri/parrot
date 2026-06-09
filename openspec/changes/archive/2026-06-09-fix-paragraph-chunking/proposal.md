## Why

TTS text chunking (`splitTextForTts`) currently breaks only on bare periods, so ellipsis (`...`) is misread as a sentence end. That splits phrases like "But sometimes, she felt a little... contained, maybe?" into two chunks at the ellipsis instead of keeping the full thought together. Incorrect chunk boundaries degrade audio synthesis (unnatural pauses mid-phrase) and break script-sync highlighting, which maps one alignment segment per TTS chunk (Option B).

## What Changes

- Fix `splitTextForTts` to implement the intended boundary priority: paragraph (`\n\n`), line (`\n`), then real sentence endings
- Treat ellipsis (`...`, `…`) as a sentence boundary only when the next word starts with an uppercase letter; lowercase continuation (e.g. `... contained`) stays in the same chunk
- Treat `!`, `?`, and common closing punctuation as sentence boundaries (alongside `.`)
- Add unit tests covering ellipsis, paragraph preference, and the reported regression case
- Existing speeches with stored alignment are unaffected; new previews and speeches will use corrected chunk boundaries

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `speech-text-chunking`: Clarify sentence-boundary rules (ellipsis capitalization heuristic, paragraph-first scan) and add regression scenarios for ellipsis and paragraph grouping

## Impact

- **Code**: `src/lib/speech-text-chunking.ts`, new unit tests under `src/lib/`
- **Downstream**: `generateLongSpeech` alignment segments, `SpeechScriptSyncViewer` highlight boundaries, and `alignmentSegmentsMatchScriptChunks` validation—all derive chunk text from `splitTextForTts`; no API contract changes
- **Data**: No migration; persisted alignment on existing speeches remains as generated
- **Systems**: No external service changes; chunk count may decrease slightly for scripts with ellipsis-heavy prose
