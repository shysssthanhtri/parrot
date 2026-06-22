## Why

When a speech thumbnail does not match the author's intent, **Regenerate thumbnail** reruns generation from script metadata alone with no way to steer the image. Authors need a one-off prompt hint at regenerate time (e.g. mood, setting, or visual style) without persisting it on the speech record.

## What Changes

- Add an optional **extra prompt** field to the **Regenerate thumbnail** confirmation dialog in the CMS speech detail page.
- Extend `speeches.regenerateThumbnail` to accept an optional `extraPrompt` string and pass it through to the thumbnail workflow for that run only.
- Append the extra prompt to the built thumbnail prompt when present; omit it when empty or on initial create / automatic generation.
- Do **not** add database fields or persist the extra prompt on `Speech` or `SpeechThumbnailGeneration`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `speeches`: `regenerateThumbnail` accepts optional `extraPrompt`; prompt is used only for that regeneration run.
- `cms-speeches`: Regenerate thumbnail dialog collects optional extra prompt before confirming.
- `speech-thumbnail-jobs`: Thumbnail workflow accepts optional extra prompt for manual regenerate runs and incorporates it into the Modal API prompt within the existing length limit.

## Impact

- **API:** `speeches.regenerateThumbnail` input schema gains optional `extraPrompt` (Zod-validated max length aligned with prompt budget).
- **CMS UI:** `SpeechRegenerateThumbnailButton` dialog adds a textarea; wire through `speech-detail-client.tsx`.
- **Background jobs:** `startSpeechThumbnailWorkflow`, `speechThumbnailWorkflow`, and prompt building in `speech-thumbnail-processing` / `speech-thumbnail-prompt.ts` thread the ephemeral value.
- **Storage / DB:** No schema migration; no new persisted fields.
- **Dependencies:** None.
