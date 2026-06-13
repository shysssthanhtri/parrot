## Context

Parrot generates speech audio asynchronously via Vercel Queues and Modal Chatterbox TTS (`modal/chatterbox_tts.py`). Publishing freezes a learner snapshot in `SpeechPublication`. Learners will soon browse published speeches as image cards; each speech needs a cover thumbnail generated from script metadata (title, topics, language).

Today publish validation lives inline in `buildPublicationSnapshot` (`src/lib/speech-publication.ts`), and the CMS **Publish** button only checks `processStatus === finished`. There is no thumbnail pipeline. The combined **Unpublish and regenerate…** action is redundant now that unpublish and regenerate are separate steps.

## Goals / Non-Goals

**Goals:**

- Generate an 832×1088 portrait thumbnail automatically when a speech is created.
- Process thumbnail generation in background via Vercel Queue (`speech-thumbnail`, `maxConcurrency: 1`) calling a new Modal app (SD 3.5 Medium Turbo on A10G, `max_containers: 1`, `max_inputs: 1`).
- Store thumbnail on `Speech` during authoring; copy `thumbnailR2ObjectKey` into the publication snapshot on publish.
- Expose manual `speeches.regenerateThumbnail` when not published; block when published.
- Refactor publish validation into an extensible checker list; require a finished thumbnail before publish.
- Remove `unpublishAndRegenerate` API and CMS control.
- Add CI: `deploy-modal-thumbnail-image.yml` and `thumbnail-api-key` in `setup-modal-secrets.yml`.

**Non-Goals:**

- Learner catalog UI (Focus Cards) — only API fields and CMS preview.
- Auto-regenerate thumbnail on TTS finish, retry, or audio regenerate.
- Modal writing directly to R2 (Next.js queue worker uploads via existing storage lib).
- OpenAPI codegen for the thumbnail API in v1 (hand-written fetch client mirroring early Chatterbox pattern is acceptable).
- Changing TTS queue topology or Chatterbox deployment.

## Decisions

### Thumbnail fields on Speech

Add to `Speech`:

| Field                    | Type      | Purpose                                                          |
| ------------------------ | --------- | ---------------------------------------------------------------- |
| `thumbnailR2ObjectKey`   | `String?` | Storage key, e.g. `speeches/{id}/thumbnail.webp`                 |
| `thumbnailProcessStatus` | `String`  | `pending`, `processing`, `finished`, `failed`; default `pending` |
| `thumbnailErrorMessage`  | `String?` | User-safe message when `failed`                                  |

Add `thumbnailR2ObjectKey` to `SpeechPublication` snapshot fields (non-null after successful publish).

**Alternative:** Store thumbnail only on publication — rejected; thumbnail is generated at create, before any publication row exists.

### Enqueue on create only

`speeches.create` SHALL call `enqueueSpeechThumbnail(speechId)` alongside `enqueueSpeechTtsStart`. No enqueue from TTS finalize, retry, or regenerate.

Manual `speeches.regenerateThumbnail` resets status to `pending`, deletes existing thumbnail object if present, and enqueues one job. Guard with `assertSpeechNotPublished` (same as audio regenerate).

**Alternative:** Enqueue on publish — rejected; author would wait at publish time; explore decision was create-time generation.

### Publish readiness checker list

Extract from `buildPublicationSnapshot` into `src/lib/speech-publish-readiness.ts`:

```typescript
type PublishReadinessIssue = { code: string; message: string };
type PublishReadinessChecker = (
  speech
) => Promise<PublishReadinessIssue | null>;
```

Initial checkers (order preserved):

1. `checkAudioFinished` — `processStatus === finished`
2. `checkAlignmentPresent` — non-null alignment
3. `checkAlignmentValid` — Zod parse
4. `checkFinalAudioExists` — `objectExists(r2ObjectKey)`
5. `checkThumbnailReady` — `thumbnailProcessStatus === finished` and object exists

`assertSpeechReadyToPublish(speech)` throws on first issue (for mutations). `getPublishReadinessIssues(speech)` returns all issues (for CMS UI).

`buildPublicationSnapshot` calls `assertSpeechReadyToPublish` then builds snapshot including `thumbnailR2ObjectKey`.

New tRPC `speeches.getPublishReadiness` returns `{ issues: PublishReadinessIssue[] }` for the detail page.

**Alternative:** Keep inline throws in snapshot builder — rejected; CMS needs multiple blockers and future checks.

### Modal app: SD 3.5 Medium Turbo on A10G

New file `modal/speech_thumbnail.py`, app name `parrot-speech-thumbnail`.

Mirror Chatterbox class constraints:

```python
@app.cls(
    gpu="a10g",
    max_containers=1,
    scaledown_window=60 * 5,
    secrets=[modal.Secret.from_name("hf-token"), modal.Secret.from_name("thumbnail-api-key")],
    volumes={CACHE_DIR: hf_cache_volume},
)
@modal.concurrent(max_inputs=1)
class ThumbnailInference:
    ...
```

- Model: SD 3.5 Medium Turbo (Hugging Face; gated model uses existing `hf-token`).
- Inference: 832×1088, 4 steps, `guidance_scale=0.0`, PNG bytes returned.
- FastAPI ASGI: `POST /generate` with `x-api-key` header; body `{ prompt: string, seed?: number }`.

Queue worker (`src/lib/speech-thumbnail-processing.ts`) builds prompt from script title, topic names/colors, and language hint; calls Modal; converts PNG → WebP if desired; `uploadObject` to pre-assigned key; updates `Speech` status.

**Alternative:** SD 3.5 Large Turbo on H100 — rejected; higher cost with no meaningful gain at thumbnail display size.

### Vercel Queue topic

| Topic              | Route                                          | maxConcurrency |
| ------------------ | ---------------------------------------------- | -------------- |
| `speech-thumbnail` | `src/app/api/queues/speech-thumbnail/route.ts` | 1              |

Register in `vercel.json` with `maxDuration: 300` (Modal cold start tolerance).

Library: `src/lib/speech-thumbnail-jobs.ts` (`enqueueSpeechThumbnail`, message type `{ speechId }`).

**Alternative:** Share TTS start topic — rejected; independent concurrency and failure domains.

### Storage keys

Add to `src/lib/storage/speech-keys.ts`:

- `speechThumbnailObjectKey(id)` → `speeches/{id}/thumbnail.webp`
- Validation helper for upload route if needed

Delete thumbnail object on `speeches.delete` and before manual regenerate.

### Environment and secrets

Next.js (`src/lib/env.ts`):

- `THUMBNAIL_API_URL` — Modal serve base URL
- `THUMBNAIL_API_KEY` — matches Modal `thumbnail-api-key` secret

Modal secrets (via `.github/workflows/setup-modal-secrets.yml`):

- Reuse `hf-token`
- New `thumbnail-api-key` from GitHub secret `THUMBNAIL_API_KEY`

Deploy: `.github/workflows/deploy-modal-thumbnail-image.yml` runs `modal deploy modal/speech_thumbnail.py` on `workflow_dispatch` (same pattern as `deploy-modal-tts.yml`; no R2 env vars on deploy).

### Remove unpublishAndRegenerate

Delete mutation from `speech-publications.ts`, component `speech-unpublish-and-regenerate-button.tsx`, and client wiring. Published authors: **Unpublish** → **Regenerate** (audio/thumbnail separately) → **Publish**.

## Risks / Trade-offs

| Risk                                                           | Mitigation                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------- |
| Modal cold start (~30–60s) delays first thumbnail              | Acceptable for v1; serial queue; CMS shows generating state   |
| Thumbnail queue backs up behind many creates                   | maxConcurrency 1 by design; authors see status on detail page |
| Stale thumbnail after script title change without manual regen | Document in CMS; manual regenerate before publish             |
| SD 3.5 Medium Turbo model access / HF gating                   | Reuse existing `hf-token` secret                              |
| Publish blocked while thumbnail failed                         | Clear readiness message + manual regenerate button            |

## Migration Plan

1. Add Prisma migration; backfill existing speeches: `thumbnailProcessStatus = pending` (or `failed` with message if auto-backfill not run — prefer enqueueing a one-off job or leaving unpublished speeches to manual regen).
2. Run **Setup Modal Secrets** (new `thumbnail-api-key` step) after adding `THUMBNAIL_API_KEY` to GitHub.
3. Run **Deploy Thumbnail Image to Modal**; set `THUMBNAIL_API_URL` in Vercel.
4. Deploy Next.js (queue route, env, UI).
5. Existing published speeches without thumbnails: unpublish/republish not possible until thumbnail ready — run manual regenerate for drafts or a one-time backfill script (out of scope unless needed).

**Rollback:** Disable enqueue in create/regenerate; publish check can temporarily skip thumbnail checker if emergency (not recommended).

## Open Questions

- None blocking v1. Optional follow-up: one-time backfill job for speeches created before this change.
