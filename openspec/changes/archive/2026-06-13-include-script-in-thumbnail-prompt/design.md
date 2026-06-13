## Context

Speech thumbnails are generated asynchronously via the `speech-thumbnail` Vercel Queue worker in `src/lib/speech-thumbnail-processing.ts`. The worker calls Modal SD 3.5 Medium Turbo (`modal/speech_thumbnail.py`) with a text prompt and stores the resulting WebP in R2.

Today `buildSpeechThumbnailPrompt` uses only script title, linked topic names/colors, and language label. The script body (`Script.content`) is not loaded or referenced, so generated cover art cannot reflect the narrative or subject matter of the shadowing text.

The Modal API enforces `prompt` max length 5000 characters (`ThumbnailRequest` in `modal/speech_thumbnail.py`). Scripts can be much longer, so content must be excerpted to fit the overall prompt budget.

## Goals / Non-Goals

**Goals:**

- Load script `content` in the thumbnail worker context.
- Include script content in the SD prompt so imagery reflects speech subject matter.
- Truncate content so the final prompt stays within the 5000-character Modal limit.
- Preserve existing stylistic constraints (no text/typography in image, editorial portrait cover art).
- Add unit tests for `buildSpeechThumbnailPrompt` covering content inclusion and truncation.

**Non-Goals:**

- LLM summarization of script content for the prompt.
- Auto-regenerating thumbnails when script content changes (existing manual regenerate flow remains).
- Schema or CMS UI changes.
- Changing Modal model, resolution, or queue topology.

## Decisions

### Include script content as a narrative excerpt in the prompt

Extend `SpeechThumbnailContext.script` with `content: string`. In `buildSpeechThumbnailPrompt`, add a segment such as:

> `Story/subject: "<excerpt>"`

placed after title/topics and before the language/style lines.

**Alternative:** LLM summary of content — rejected; adds latency, cost, and an extra failure mode for a background job that should stay simple.

**Alternative:** Use only the first sentence — rejected; may miss setting or key imagery from later in short scripts; word-boundary truncation of a budgeted excerpt is sufficient.

### Truncate to fit Modal's 5000-character limit

Export a small helper (e.g. `truncateForThumbnailPrompt(text, maxLength)`) used by `buildSpeechThumbnailPrompt`:

1. Build the fixed prompt parts (title, topics, language, style guardrails) without content.
2. Compute remaining budget: `5000 - fixedPart.length - excerptWrapper.length`.
3. If budget ≤ 0, omit content excerpt (degrades to current behavior).
4. Otherwise truncate `content` at a word boundary to the budget; append `"…"` when truncated.

Reserve a constant `SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH = 5000` aligned with Modal's Pydantic schema.

**Alternative:** Raise if over limit — rejected; would fail jobs for long scripts.

### Prisma select change only

Add `content: true` to the existing `script.select` in `loadSpeechThumbnailContext`. No migration required.

### Tests with Node test runner

Add `src/lib/speech-thumbnail-processing.test.ts` following existing patterns (`node:test`, `node:assert/strict`). Test:

- Prompt includes content excerpt when script has content.
- Prompt omits content segment when content is empty.
- Full prompt length ≤ 5000 for a very long script.

Export `buildSpeechThumbnailPrompt` (already exported) and any truncation helper needed for direct testing.

## Risks / Trade-offs

| Risk                                              | Mitigation                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Long scripts only partially represented in prompt | Truncate from start at word boundary; first portion usually carries setting/subject |
| Prompt still generic if content is abstract       | Title + topics remain; content excerpt adds more signal than metadata alone         |
| Very long fixed prompt leaves no room for content | Omit excerpt when budget exhausted; same as today                                   |
| Stale thumbnail after script edit                 | Unchanged; authors use existing manual regenerate                                   |

## Migration Plan

1. Deploy code change only (no DB migration).
2. New speeches get content-aware prompts on create.
3. Existing speeches: authors regenerate thumbnail manually if desired.
4. **Rollback:** Revert prompt builder; no data migration needed.

## Open Questions

- None blocking. Optional follow-up: regenerate thumbnails in bulk for existing speeches (out of scope).
