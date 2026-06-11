# cms-voices Specification

## MODIFIED Requirements

### Requirement: CMS voices list page

The CMS SHALL provide a page at `/cms/voices` that displays all voices in a shadcn table with columns appropriate for browsing (at minimum: name, language, description snippet, updated date). The page SHALL use the shared CMS page header with **Voices** as the current breadcrumb segment instead of an in-page `h1` title. The page SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: View voices table

- **WHEN** an authenticated CMS user navigates to `/cms/voices`
- **THEN** a table of all voices is shown below the page header breadcrumb **Voices**

### Requirement: CMS voice detail page

The CMS SHALL provide a read-only detail page at `/cms/voices/[voiceId]` showing voice metadata (name, description, language, timestamps). The page SHALL use the shared CMS page header with breadcrumbs **Voices** (link to `/cms/voices`) and the voice name as the current segment instead of an in-page back link. The page SHALL NOT show creator/`createdBy` in v1.

#### Scenario: View voice metadata

- **WHEN** an authenticated CMS user opens `/cms/voices/{id}` for an existing voice
- **THEN** the voice metadata is displayed below the page header breadcrumbs **Voices** → voice name

### Requirement: Loading UI on voices list page

While the voices list page is loading (server data fetch in progress), the CMS SHALL display a loading UI at `/cms/voices` that matches the list page layout: shared page header with **Voices** breadcrumb and a table skeleton with columns for name, language, description, and updated date. The loading UI SHALL appear without requiring authentication changes and SHALL be replaced by the full page once data is ready.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated CMS user navigates to `/cms/voices` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with the shared page header breadcrumb **Voices** and a table-shaped placeholder matching the voices list columns
