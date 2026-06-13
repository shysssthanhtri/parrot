## 1. Thumbnail prompt builder

- [x] 1.1 Add `SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH = 5000` and a word-boundary truncation helper in `src/lib/speech-thumbnail-processing.ts`
- [x] 1.2 Extend `SpeechThumbnailContext.script` and `loadSpeechThumbnailContext` Prisma select to include `content`
- [x] 1.3 Update `buildSpeechThumbnailPrompt` to include a truncated script content excerpt while preserving existing title, topic, language, and no-text style lines
