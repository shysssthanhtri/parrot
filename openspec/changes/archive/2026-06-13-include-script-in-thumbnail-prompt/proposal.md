## Why

Speech thumbnails are generated from script title, topics, and language only. The actual script body—the narrative, setting, and subject matter learners will shadow—is omitted from the image prompt, so cover art often feels generic and disconnected from the speech content. Including script content in the prompt will produce thumbnails that visually reflect what the speech is about.

## What Changes

- Extend the thumbnail queue worker to load script `content` alongside existing metadata.
- Update `buildSpeechThumbnailPrompt` to incorporate script content (with sensible truncation for long scripts) so the SD prompt reflects the speech subject matter.
- Keep the existing "no text in image" constraint and other stylistic guardrails.
- Add unit tests for prompt building with and without script content.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `speech-thumbnail-jobs`: Thumbnail worker prompt building SHALL include script content in addition to title, topics, and language.

## Impact

- **Code:** `src/lib/speech-thumbnail-processing.ts` (Prisma select, prompt builder); new or extended tests for `buildSpeechThumbnailPrompt`.
- **APIs / jobs:** No new endpoints or queue topics; same Modal `/generate` call with a richer prompt string.
- **CMS / storage:** No UI or schema changes; existing regenerate flow picks up the new prompt on next job run.
- **Dependencies:** None.
