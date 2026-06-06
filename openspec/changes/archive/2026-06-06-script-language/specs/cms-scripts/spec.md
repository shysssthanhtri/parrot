## MODIFIED Requirements

### Requirement: CMS scripts list page

The CMS SHALL provide a page at `/cms/scripts` that displays all scripts in a shadcn table with columns appropriate for browsing (at minimum: title, language, content snippet, updated date). The language column SHALL display a human-readable label (English, Vietnamese, Chinese, Korean, or Japanese). The page SHALL be behind existing CMS authentication.

#### Scenario: View scripts table

- **WHEN** an authenticated user navigates to `/cms/scripts`
- **THEN** a table of all scripts is shown including a language column with a readable label for each row

### Requirement: CMS script create page

The CMS SHALL provide a page at `/cms/scripts/new` with a form to enter `title`, `content`, and `language` (shared with the detail page). The language field SHALL be a select control with exactly five options: English, Vietnamese, Chinese, Korean, and Japanese (default English). On successful save, the app SHALL redirect to `/cms/scripts/{scriptId}` for the newly created script.

#### Scenario: Create and redirect

- **WHEN** user submits valid title, content, and language on `/cms/scripts/new`
- **THEN** a script is created and the user is navigated to `/cms/scripts/{id}` for that script

### Requirement: CMS script detail page with edit form

The CMS SHALL provide a page at `/cms/scripts/[scriptId]` that loads an existing script and renders the shared form prefilled with `title`, `content`, and `language`. On successful save, the user SHALL remain on the same page and receive a success indication (e.g. toast). The page SHALL NOT show creator/`createdBy` in v1.

#### Scenario: Edit and stay

- **WHEN** user updates fields and saves on `/cms/scripts/{id}` for an existing script
- **THEN** the script is updated, the user stays on `/cms/scripts/{id}`, and a success indication is shown

#### Scenario: Script not found

- **WHEN** user opens `/cms/scripts/{id}` for a non-existent script
- **THEN** a not-found UI is shown

### Requirement: Shared script form component

Create and detail pages SHALL use the same form component for `title`, `content`, and `language` fields and submit behavior, differing only in initial values and whether create or update is invoked. The `language` field SHALL be a select with the five supported options (not a free-text input).

#### Scenario: Same fields on create and edit

- **WHEN** user views `/cms/scripts/new` or `/cms/scripts/{id}` for an existing script
- **THEN** both pages present `title`, `content`, and a language select via the shared form

#### Scenario: Language select options

- **WHEN** user opens the language select on the script form
- **THEN** exactly five options are available: English, Vietnamese, Chinese, Korean, and Japanese
