# cms-scripts Specification

## MODIFIED Requirements

### Requirement: CMS scripts list page

The CMS SHALL provide a page at `/cms/scripts` that displays all scripts in a shadcn table with columns appropriate for browsing (at minimum: title, language, length, content snippet, updated date). The language column SHALL display a human-readable label (English, Vietnamese, Chinese, Korean, or Japanese). The length column SHALL display the script's stored `contentLength` formatted as a locale-aware integer with a "chars" suffix (e.g. `1,234 chars`). The page SHALL use the shared CMS page header with **Scripts** as the current breadcrumb segment instead of an in-page `h1` title. The page SHALL provide a **New script** control below the header. The page SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: View scripts table

- **WHEN** an authenticated CMS user navigates to `/cms/scripts`
- **THEN** a table of all scripts is shown below the page header breadcrumb **Scripts**, including language and length columns with readable labels for each row

### Requirement: CMS script create page

The CMS SHALL provide a page at `/cms/scripts/new` with a form to enter `title`, `content`, and `language` (shared with the detail page). The page SHALL use the shared CMS page header with breadcrumbs **Scripts** (link to `/cms/scripts`) and **New** as the current segment instead of an in-page back link. The language field SHALL be a select control with exactly five options: English, Vietnamese, Chinese, Korean, and Japanese (default English). The create form SHALL additionally offer **Generate with AI** to draft `title` and `content` from a prompt and length selection. On successful save, the app SHALL redirect to `/cms/scripts/{scriptId}` for the newly created script. When the draft originated from AI generation, save SHALL pass `generationId` to link the script to its generation record.

#### Scenario: Create and redirect

- **WHEN** user submits valid title, content, and language on `/cms/scripts/new`
- **THEN** a script is created and the user is navigated to `/cms/scripts/{id}` for that script

#### Scenario: AI draft then create

- **WHEN** user generates a draft with **Generate with AI**, optionally edits the fields, and saves
- **THEN** a script is created with the final title and content, the generation record is linked via `scriptId`, and the user is navigated to `/cms/scripts/{id}`

### Requirement: CMS script detail page with edit form

The CMS SHALL provide a page at `/cms/scripts/[scriptId]` that loads an existing script and renders the shared form prefilled with `title`, `content`, and `language`. The page SHALL use the shared CMS page header with breadcrumbs **Scripts** (link to `/cms/scripts`) and the script title as the current segment instead of an in-page back link. On successful save, the user SHALL remain on the same page and receive a success indication (e.g. toast). The page SHALL provide a **Delete script** control with a confirmation dialog that calls `scripts.delete` and, on success, navigates to `/cms/scripts` with a success toast. When the script has one or more linked speeches (`_count.speeches` greater than zero), the confirmation dialog SHALL warn the user that those speeches and their generated audio will also be permanently deleted. The page SHALL NOT show creator/`createdBy` in v1.

#### Scenario: Edit and stay

- **WHEN** user updates fields and saves on `/cms/scripts/{id}` for an existing script
- **THEN** the script is updated, the user stays on `/cms/scripts/{id}`, and a success indication is shown

#### Scenario: Script not found

- **WHEN** user opens `/cms/scripts/{id}` for a non-existent script
- **THEN** a not-found UI is shown

#### Scenario: Delete script with no speeches

- **WHEN** user clicks **Delete script** on a script with zero speeches and confirms the dialog
- **THEN** `scripts.delete` is called, a success toast is shown, and the app navigates to `/cms/scripts`

#### Scenario: Delete script with speeches warns about cascade

- **WHEN** user clicks **Delete script** on a script with one or more speeches
- **THEN** the confirmation dialog states that the linked speeches and their audio will also be deleted

#### Scenario: Delete script with speeches on confirm

- **WHEN** user confirms delete on a script with speeches
- **THEN** `scripts.delete` is called, a success toast is shown, and the app navigates to `/cms/scripts`

#### Scenario: Cancel delete

- **WHEN** user opens the delete confirmation dialog and clicks cancel
- **THEN** no delete request is sent and the user remains on the detail page

## ADDED Requirements

### Requirement: Loading UI on scripts list page

While the scripts list page is loading (server data fetch in progress), the CMS SHALL display a loading UI at `/cms/scripts` that matches the list page layout: shared page header with **Scripts** breadcrumb and a table skeleton with columns for title, language, length, content snippet, and updated date.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated CMS user navigates to `/cms/scripts` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with the shared page header breadcrumb **Scripts** and a table-shaped placeholder matching the scripts list columns
