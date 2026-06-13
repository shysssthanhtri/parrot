## Why

Learners will browse published speeches as visual cards; each speech needs a cover image generated from its script metadata. Authors should get that image automatically when a speech is created, with manual regeneration before publish, while publishing stays gated on a complete thumbnail alongside finished audio. The current **Unpublish and regenerate** combined action adds complexity without clear benefit now that unpublish and regenerate are separate steps.

## What Changes

- Add thumbnail fields on `Speech` (`thumbnailR2ObjectKey`, `thumbnailProcessStatus`, `thumbnailErrorMessage`) and snapshot `thumbnailR2ObjectKey` on `SpeechPublication` at publish time.
- Auto-enqueue thumbnail generation on `speeches.create` (once per speech). No auto-regeneration on TTS finish, retry, or audio regenerate.
- Add `speeches.regenerateThumbnail` (manual, blocked when publication status is `published`).
- Introduce a Vercel Queue topic `speech-thumbnail` (`maxConcurrency: 1`) and a new Modal app using **SD 3.5 Medium Turbo on A10G** (`max_containers: 1`, `max_inputs: 1`) at **832×1088**.
- Refactor publish validation into an extensible readiness checker list; **publish requires a finished thumbnail** in storage.
- Add CMS thumbnail preview/status and manual regenerate on the speech detail page; extend publish UI to reflect all readiness blockers.
- Add GitHub Actions: `deploy-modal-thumbnail-image.yml` and a `thumbnail-api-key` sync step in `setup-modal-secrets.yml`.
- **BREAKING**: Remove `speechPublications.unpublishAndRegenerate` and the CMS **Unpublish and regenerate…** control.

## Capabilities

### New Capabilities

- `speech-thumbnail-jobs`: Async thumbnail generation via Vercel Queue and Modal SD 3.5 Medium Turbo; prompt building, R2 upload, and process status on `Speech`.

### Modified Capabilities

- `speeches`: Thumbnail fields on create/read; auto-enqueue on create; `regenerateThumbnail` mutation; `getPublishReadiness` query (or equivalent) exposing extensible blocker list.
- `speech-publications`: Snapshot includes `thumbnailR2ObjectKey`; publish uses shared readiness checks; learner list/detail expose `thumbnailUrl`; remove `unpublishAndRegenerate`.
- `cms-speeches`: Thumbnail section on speech detail (preview, status, manual regenerate); publish button gated on full readiness list.
- `cms-speech-publishing`: Remove **Unpublish and regenerate…**; update published-state copy; publish disabled until readiness checks pass (not only `processStatus === finished`).

## Impact

- **Database**: Prisma migration on `Speech` and `SpeechPublication`.
- **Modal**: New `modal/speech_thumbnail.py`; deploy workflow; reuses `hf-token`, new `thumbnail-api-key` secret.
- **Queues**: New topic/handler in `vercel.json`; enqueue from `speeches.create` and `regenerateThumbnail`.
- **API**: Updates to `speeches` and `speech-publications` routers; new lib modules (`speech-publish-readiness`, `speech-thumbnail-jobs`, thumbnail client).
- **Env**: `THUMBNAIL_API_URL`, `THUMBNAIL_API_KEY` in `.env.example` and `src/lib/env.ts`.
- **CMS UI**: Thumbnail card; publishing card simplification; remove `speech-unpublish-and-regenerate-button.tsx`.
- **Storage**: New object key pattern `speeches/{id}/thumbnail.webp` (or equivalent).
- **Learner API**: Published list/detail include resolved thumbnail URL (learner catalog UI out of scope).
