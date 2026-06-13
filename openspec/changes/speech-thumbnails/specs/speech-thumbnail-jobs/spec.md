## ADDED Requirements

### Requirement: Speech thumbnail queue topic

The system SHALL use `@vercel/queue` with a push-mode topic `speech-thumbnail` and a dedicated Next.js route handler at `src/app/api/queues/speech-thumbnail/route.ts` registered in `vercel.json` with `experimentalTriggers` of type `queue/v2beta` and `maxConcurrency` 1.

#### Scenario: Thumbnail job invokes handler

- **WHEN** a message is sent to `speech-thumbnail`
- **THEN** the route handler processes exactly one job at a time app-wide per configured concurrency

### Requirement: Thumbnail generation on speech create

When `speeches.create` succeeds, the system SHALL enqueue a `speech-thumbnail` message with the new speech id in addition to the existing TTS start job. The system SHALL NOT auto-enqueue thumbnail jobs from TTS finalize, `speeches.retry`, or `speeches.regenerate`.

#### Scenario: Create enqueues thumbnail job

- **WHEN** an authenticated CMS client creates a speech
- **THEN** a thumbnail queue message is enqueued for that speech id

#### Scenario: Audio regenerate does not enqueue thumbnail

- **WHEN** `speeches.regenerate` succeeds for a speech
- **THEN** no thumbnail queue message is enqueued

### Requirement: Thumbnail queue worker processing

The `speech-thumbnail` consumer SHALL load the speech with linked script (title) and script topics (name, color), build a text prompt suitable for cover-art generation (no text in the image), set `thumbnailProcessStatus` to `processing`, call the Modal thumbnail API at the configured resolution 832×1088, upload the result to `thumbnailR2ObjectKey` via the configured storage driver, set `thumbnailProcessStatus` to `finished`, and clear `thumbnailErrorMessage`. On failure after retries it SHALL set `thumbnailProcessStatus` to `failed` with a user-safe `thumbnailErrorMessage`.

#### Scenario: Successful thumbnail job

- **WHEN** the thumbnail worker completes for a speech
- **THEN** the thumbnail object exists at `thumbnailR2ObjectKey` and `thumbnailProcessStatus` is `finished`

#### Scenario: Failed thumbnail job

- **WHEN** the thumbnail worker fails after queue retries are exhausted
- **THEN** `thumbnailProcessStatus` is `failed` and `thumbnailErrorMessage` is set

### Requirement: Modal speech thumbnail deployment

The repository SHALL include `modal/speech_thumbnail.py` deploying a Modal app that runs SD 3.5 Medium Turbo on `a10g` with `max_containers` 1 and `@modal.concurrent(max_inputs=1)`. The app SHALL expose an authenticated `POST /generate` endpoint accepting a prompt and returning PNG image bytes at 832×1088. Deployment SHALL be performed via `.github/workflows/deploy-modal-thumbnail-image.yml` using existing `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET`. Modal secrets SHALL include `hf-token` and `thumbnail-api-key` synced by `.github/workflows/setup-modal-secrets.yml`.

#### Scenario: Deploy workflow targets thumbnail app

- **WHEN** the deploy thumbnail workflow is run manually
- **THEN** `modal deploy modal/speech_thumbnail.py` is executed

#### Scenario: Setup secrets includes thumbnail API key

- **WHEN** the setup Modal secrets workflow is run
- **THEN** a Modal secret `thumbnail-api-key` is created or updated from GitHub secret `THUMBNAIL_API_KEY`
