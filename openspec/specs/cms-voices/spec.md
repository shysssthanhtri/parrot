# cms-voices Specification

## Purpose

TBD - created by archiving change voices. Update Purpose after archive.

## Requirements

### Requirement: CMS voices list page

The CMS SHALL provide a page at `/cms/voices` that displays all voices in a shadcn table with columns appropriate for browsing (at minimum: name, language, description snippet, updated date). The page SHALL be behind existing CMS authentication.

#### Scenario: View voices table

- **WHEN** an authenticated user navigates to `/cms/voices`
- **THEN** a table of all voices is shown

### Requirement: Navigate to voice detail from list

The CMS SHALL allow clicking a voice table row to navigate to `/cms/voices/{voiceId}`.

#### Scenario: Row click opens detail

- **WHEN** user clicks a voice row in the list table
- **THEN** the app navigates to the detail page for that voice's id

### Requirement: CMS voice detail page

The CMS SHALL provide a read-only detail page at `/cms/voices/[voiceId]` showing voice metadata (name, description, language, timestamps). The page SHALL NOT show creator/`createdBy` in v1.

#### Scenario: View voice metadata

- **WHEN** an authenticated user opens `/cms/voices/{id}` for an existing voice
- **THEN** the voice metadata is displayed

### Requirement: Audio preview on detail page

When the voice has `r2ObjectKey` set, the detail page SHALL render a waveform-based audio player using a presigned URL. The player SHALL display a visual waveform of the sample, provide play/pause transport controls, show elapsed and total duration, and allow seeking by interacting with the waveform. When `r2ObjectKey` is null, the page SHALL show metadata without a player (or a clear empty state) and SHALL NOT error.

#### Scenario: Preview available

- **WHEN** user views detail for a voice with `r2ObjectKey`
- **THEN** a waveform player loads and plays the R2 object via presigned URL with visible waveform, transport controls, and time display

#### Scenario: Seek during preview

- **WHEN** user clicks or drags on the waveform while preview is loaded
- **THEN** playback position updates to the corresponding point in the sample

#### Scenario: No audio yet

- **WHEN** user views detail for a voice without `r2ObjectKey`
- **THEN** metadata is shown and no audio player is offered (or a non-blocking empty message)

### Requirement: Loading UI on voices list page

While the voices list page is loading (server data fetch in progress), the CMS SHALL display a loading UI at `/cms/voices` that matches the list page layout: page heading area and a table skeleton with columns for name, language, description, and updated date. The loading UI SHALL appear without requiring authentication changes and SHALL be replaced by the full page once data is ready.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated user navigates to `/cms/voices` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with a table-shaped placeholder matching the voices list columns

#### Scenario: Loading resolves to list

- **WHEN** voice data finishes loading on `/cms/voices`
- **THEN** the loading UI is replaced by the voices table (or empty state)
