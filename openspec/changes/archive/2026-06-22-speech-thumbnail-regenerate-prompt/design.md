## Context

Speech thumbnails are generated asynchronously via `speechThumbnailWorkflow` when a speech is created or when the author clicks **Regenerate thumbnail** on the CMS speech detail page. The Modal API prompt is built server-side in `buildSpeechThumbnailPrompt` from script title, topics, language, and a truncated content excerpt (`src/lib/speech-thumbnail-prompt.ts`). Manual regenerate today calls `speeches.regenerateThumbnail` with only `{ id }` and restarts the workflow with no author steering.

The regenerate confirmation lives in `SpeechRegenerateThumbnailButton`; the mutation is wired in `speech-detail-client.tsx`. Workflow entry is `startSpeechThumbnailWorkflow` → `start(speechThumbnailWorkflow, [speechId])`.

## Goals / Non-Goals

**Goals:**

- Let CMS authors optionally supply a one-off extra prompt when confirming thumbnail regeneration.
- Thread that value through tRPC → workflow start → prompt builder → Modal API for that run only.
- Keep initial create and automatic generation unchanged (no extra prompt).
- Preserve the existing 5000-character Modal prompt limit.

**Non-Goals:**

- Persisting the extra prompt on `Speech`, `SpeechThumbnailGeneration`, or any new table.
- Pre-filling the dialog from a previous regenerate.
- Changing thumbnail generation on speech create, audio regenerate, or retry.
- Changing the Modal deployment or image API.

## Decisions

### 1. Pass extra prompt as workflow input (not persisted)

**Choice:** Add an optional `extraPrompt?: string` argument to `startSpeechThumbnailWorkflow` and `speechThumbnailWorkflow`, passed via `start(speechThumbnailWorkflow, [speechId, extraPrompt])`.

**Alternatives considered:**

- Store on `SpeechThumbnailGeneration` — rejected; user explicitly does not want persistence.
- Store in object storage metadata — rejected; unnecessary complexity and still persisted.

**Rationale:** Workflow run arguments are already ephemeral and match the one-shot regenerate use case. Create path continues calling `startSpeechThumbnailWorkflow(speechId)` with no second argument.

### 2. Extend `buildSpeechThumbnailPrompt` with optional append

**Choice:** Add optional `extraPrompt?: string` to `buildSpeechThumbnailPrompt`. When non-empty after trim, append `Author direction: "<trimmed extra>"` before the style line. Reuse existing truncation logic so the final prompt stays ≤ `SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH` (5000); reduce the script content excerpt budget first, then truncate the extra segment if needed.

**Alternatives considered:**

- Replace script content with extra prompt — rejected; metadata should remain the base.
- Prepend extra prompt only — rejected; appending after story context reads more naturally for image models.

### 3. API validation: optional, trimmed, max 500 characters

**Choice:** `speeches.regenerateThumbnail` input becomes `{ id: string, extraPrompt?: string }` with Zod `.trim()`, `.max(500)`, and treat empty/whitespace-only as omitted.

**Alternatives considered:**

- No max (rely only on 5000 total) — rejected; authors could submit unusably long input with poor UX.
- Required prompt on regenerate — rejected; optional keeps current one-click flow when no steering is needed.

### 4. CMS UI: optional textarea in existing AlertDialog

**Choice:** Add a labeled optional `Textarea` to `SpeechRegenerateThumbnailButton`, mirroring `script-generate-dialog.tsx` patterns (`Label`, placeholder, `min-h-28`). Reset field when dialog closes. Pass trimmed value to `onRegenerateThumbnail(extraPrompt?: string)`.

**Alternatives considered:**

- Separate modal step — rejected; unnecessary for a single optional field.
- Always-visible inline field on the card — rejected; regenerate is destructive and already confirmed in a dialog.

## Risks / Trade-offs

- **[Extra prompt lost on retry]** If regenerate fails, the author must re-enter the prompt → acceptable; matches non-persistence requirement.
- **[Prompt budget contention]** Long extra prompt reduces script excerpt space → mitigate via 500-char input cap and existing total-length truncation.
- **[Workflow signature change]** Second workflow argument is ignored by stale in-flight runs from before deploy → finalize step already guards on `workflowRunId`; no migration needed.

## Migration Plan

No database migration. Deploy app code only. Existing in-flight thumbnail workflows complete with the old single-argument signature; new regenerates use the two-argument workflow. Rollback is a code revert with no data cleanup.

## Open Questions

_(none)_
