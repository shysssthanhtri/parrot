## MODIFIED Requirements

### Requirement: Thumbnail queue worker processing

The `speech-thumbnail` consumer SHALL load the speech with linked script (title, content) and script topics (name, color), build a text prompt suitable for cover-art generation that reflects the script subject matter (no text in the image), assign `thumbnailR2ObjectKey` to `speeches/{id}/thumbnail.webp` when processing starts if not already set, set `thumbnailProcessStatus` to `processing`, call the Modal thumbnail API at the configured resolution 832×1088, upload the WebP result to `thumbnailR2ObjectKey` via the configured storage driver with content type `image/webp`, set `thumbnailProcessStatus` to `finished`, and clear `thumbnailErrorMessage`. The worker SHALL NOT depend on native image libraries (e.g. `sharp`) for format conversion. On failure after retries it SHALL set `thumbnailProcessStatus` to `failed` with a user-safe `thumbnailErrorMessage`. The worker SHALL NOT fail when `thumbnailR2ObjectKey` is null at job start. The built prompt SHALL include a truncated excerpt of script content when present and SHALL stay within the Modal API prompt length limit (5000 characters).

#### Scenario: Successful thumbnail job

- **WHEN** the thumbnail worker completes for a speech
- **THEN** the thumbnail object exists at `thumbnailR2ObjectKey` as WebP and `thumbnailProcessStatus` is `finished`

#### Scenario: Failed thumbnail job

- **WHEN** the thumbnail worker fails after queue retries are exhausted
- **THEN** `thumbnailProcessStatus` is `failed` and `thumbnailErrorMessage` is set

#### Scenario: Queue handler runs on Vercel linux-x64

- **WHEN** a `speech-thumbnail` message is delivered on Vercel production (linux-x64)
- **THEN** the route handler loads and executes without requiring the `sharp` native module

#### Scenario: Worker assigns key for legacy speech

- **WHEN** the thumbnail worker runs for a speech with null `thumbnailR2ObjectKey`
- **THEN** it assigns `speeches/{id}/thumbnail.webp` before calling the Modal API and does not throw a missing-key error

#### Scenario: Prompt includes script content

- **WHEN** the thumbnail worker builds a prompt for a speech whose script has non-empty content
- **THEN** the prompt sent to the Modal API includes an excerpt of that script content in addition to title, topics, and language metadata

#### Scenario: Long script content is truncated

- **WHEN** the thumbnail worker builds a prompt for a speech whose script content would exceed the Modal API prompt length limit
- **THEN** the prompt is truncated to at most 5000 characters before calling the Modal API
