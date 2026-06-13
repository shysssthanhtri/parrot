## MODIFIED Requirements

### Requirement: Thumbnail queue worker processing

The `speech-thumbnail` consumer SHALL load the speech with linked script (title) and script topics (name, color), build a text prompt suitable for cover-art generation (no text in the image), set `thumbnailProcessStatus` to `processing`, call the Modal thumbnail API at the configured resolution 832×1088, upload the WebP result to `thumbnailR2ObjectKey` via the configured storage driver with content type `image/webp`, set `thumbnailProcessStatus` to `finished`, and clear `thumbnailErrorMessage`. The worker SHALL NOT depend on native image libraries (e.g. `sharp`) for format conversion. On failure after retries it SHALL set `thumbnailProcessStatus` to `failed` with a user-safe `thumbnailErrorMessage`.

#### Scenario: Successful thumbnail job

- **WHEN** the thumbnail worker completes for a speech
- **THEN** the thumbnail object exists at `thumbnailR2ObjectKey` as WebP and `thumbnailProcessStatus` is `finished`

#### Scenario: Failed thumbnail job

- **WHEN** the thumbnail worker fails after queue retries are exhausted
- **THEN** `thumbnailProcessStatus` is `failed` and `thumbnailErrorMessage` is set

#### Scenario: Queue handler runs on Vercel linux-x64

- **WHEN** a `speech-thumbnail` message is delivered on Vercel production (linux-x64)
- **THEN** the route handler loads and executes without requiring the `sharp` native module

### Requirement: Modal speech thumbnail deployment

The repository SHALL include `modal/speech_thumbnail.py` deploying a Modal app that runs SD 3.5 Medium Turbo on `a10g` with `max_containers` 1 and `@modal.concurrent(max_inputs=1)`. The app SHALL expose an authenticated `POST /generate` endpoint accepting a prompt and returning WebP image bytes at 832×1088 with `Content-Type: image/webp`. Deployment SHALL be performed via `.github/workflows/deploy-modal-thumbnail-image.yml` using existing `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET`. Modal secrets SHALL include `hf-token` and `thumbnail-api-key` synced by `.github/workflows/setup-modal-secrets.yml`.

#### Scenario: Deploy workflow targets thumbnail app

- **WHEN** the deploy thumbnail workflow is run manually
- **THEN** `modal deploy modal/speech_thumbnail.py` is executed

#### Scenario: Setup secrets includes thumbnail API key

- **WHEN** the setup Modal secrets workflow is run
- **THEN** a Modal secret `thumbnail-api-key` is created or updated from GitHub secret `THUMBNAIL_API_KEY`

#### Scenario: Generate returns WebP

- **WHEN** an authenticated client calls `POST /generate` with a valid prompt
- **THEN** the response has `Content-Type: image/webp` and non-empty WebP image bytes at 832×1088
