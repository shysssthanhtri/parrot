## 1. Prompt building

- [x] 1.1 Extend `buildSpeechThumbnailPrompt` in `src/lib/speech-thumbnail-prompt.ts` to accept optional `extraPrompt`, append `Author direction: "…"` when non-empty, and keep total length ≤ `SPEECH_THUMBNAIL_PROMPT_MAX_LENGTH`
- [x] 1.2 Thread optional `extraPrompt` through `generateAndUploadSpeechThumbnail` in `src/lib/speech-thumbnail-processing.ts`

## 2. Workflow

- [x] 2.1 Add optional `extraPrompt` parameter to `generateAndUploadSpeechThumbnailStep` in `src/lib/speech-thumbnail-workflow-steps.ts`
- [x] 2.2 Update `speechThumbnailWorkflow` in `src/workflows/speech-thumbnail.ts` to accept and pass optional `extraPrompt`
- [x] 2.3 Update `startSpeechThumbnailWorkflow` in `src/lib/speech-thumbnail-workflow.ts` to accept optional `extraPrompt` and pass it to `start(speechThumbnailWorkflow, [speechId, extraPrompt])`

## 3. API

- [x] 3.1 Extend `speeches.regenerateThumbnail` input in `src/trpc/routers/speeches.ts` with optional `extraPrompt` (trim, max 500, empty → omitted)
- [x] 3.2 Pass trimmed `extraPrompt` from the mutation into `startSpeechThumbnailWorkflow`

## 4. CMS UI

- [x] 4.1 Add optional **Extra prompt** textarea to `SpeechRegenerateThumbnailButton` in `src/app/(cms)/cms/speeches/[speechId]/_components/speech-regenerate-thumbnail-button.tsx`; reset on dialog close; change callback to `(extraPrompt?: string) => void`
- [x] 4.2 Wire extra prompt through `speech-detail-client.tsx` and `speech-detail.tsx` into `regenerateThumbnailMutation.mutate({ id, extraPrompt })`

## 5. Verification

- [x] 5.1 Run lint, typecheck, and build
