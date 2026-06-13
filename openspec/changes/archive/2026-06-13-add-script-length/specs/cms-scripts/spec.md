## MODIFIED Requirements

### Requirement: CMS scripts list page

The CMS SHALL provide a page at `/cms/scripts` that displays all scripts in a shadcn table with columns appropriate for browsing (at minimum: title, language, length, content snippet, updated date). The language column SHALL display a human-readable label (English, Vietnamese, Chinese, Korean, or Japanese). The length column SHALL display the script's stored target duration using human-readable labels: **Short (~30s)**, **Medium (~1m)**, or **Long (~5m)** corresponding to `short`, `medium`, and `long`. The page SHALL use the shared CMS page header with **Scripts** as the current breadcrumb segment instead of an in-page `h1` title. The page SHALL provide a **New script** control below the header. The page SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: View scripts table

- **WHEN** an authenticated CMS user navigates to `/cms/scripts`
- **THEN** a table of all scripts is shown below the page header breadcrumb **Scripts**, including language and length columns with readable labels for each row

### Requirement: CMS script create page

The CMS SHALL provide a page at `/cms/scripts/new` with a form to enter `title`, `content`, `language`, and target `length` (shared with the detail page). The page SHALL use the shared CMS page header with breadcrumbs **Scripts** (link to `/cms/scripts`) and **New** as the current segment instead of an in-page back link. The language field SHALL be a select control with exactly five options: English, Vietnamese, Chinese, Korean, and Japanese (default English). The length field SHALL be a select with exactly three options: Short (~30 seconds), Medium (~1 minute), and Long (~5 minutes) (default Medium). The create form SHALL additionally offer **Generate with AI** to draft `title` and `content` from a prompt and length selection. On successful save, the app SHALL redirect to `/cms/scripts/{scriptId}` for the newly created script. When the draft originated from AI generation, save SHALL pass `generationId` to link the script to its generation record.

#### Scenario: Create and redirect

- **WHEN** user submits valid title, content, language, and length on `/cms/scripts/new`
- **THEN** a script is created and the user is navigated to `/cms/scripts/{id}` for that script

#### Scenario: AI draft then create

- **WHEN** user generates a draft with **Generate with AI**, optionally edits the fields, and saves
- **THEN** a script is created with the final title and content, the generation record is linked via `scriptId`, and the user is navigated to `/cms/scripts/{id}`

### Requirement: CMS script detail page with edit form

The CMS SHALL provide a page at `/cms/scripts/[scriptId]` that loads an existing script and renders the shared form prefilled with `title`, `content`, `language`, and `length`. The page SHALL use the shared CMS page header with breadcrumbs **Scripts** (link to `/cms/scripts`) and the script title as the current segment instead of an in-page back link. On successful save, the user SHALL remain on the same page and receive a success indication (e.g. toast). The page SHALL provide a **Delete script** control with a confirmation dialog that calls `scripts.delete` and, on success, navigates to `/cms/scripts` with a success toast. When the script has one or more linked speeches (`_count.speeches` greater than zero), the confirmation dialog SHALL warn the user that those speeches and their generated audio will also be permanently deleted. The page SHALL NOT show creator/`createdBy` in v1.

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

### Requirement: Shared script form component

Create and detail pages SHALL use the same form component for `title`, `content`, `language`, and `length` fields and submit behavior, differing only in initial values and whether create or update is invoked. The `language` field SHALL be a select with the five supported options (not a free-text input). The `length` field SHALL be a select with the three supported target duration options (not a free-text input). In create mode, the form SHALL include **Generate with AI**; the edit/detail form SHALL NOT include generation controls in v1.

#### Scenario: Same fields on create and edit

- **WHEN** user views `/cms/scripts/new` or `/cms/scripts/{id}` for an existing script
- **THEN** both pages present `title`, `content`, a language select, and a length select via the shared form

#### Scenario: Language select options

- **WHEN** user opens the language select on the script form
- **THEN** exactly five options are available: English, Vietnamese, Chinese, Korean, and Japanese

#### Scenario: Length select options

- **WHEN** user opens the length select on the script form
- **THEN** exactly three options are available: Short (~30 seconds), Medium (~1 minute), and Long (~5 minutes)

#### Scenario: Generate only on create

- **WHEN** user views `/cms/scripts/{id}` for an existing script
- **THEN** **Generate with AI** is not shown

### Requirement: AI script generation on create page

The CMS script create page (`/cms/scripts/new`) SHALL provide a **Generate with AI** control on the shared script form (create mode only). The control SHALL open a dialog where the user can enter a content `prompt`. Generation SHALL use the form's currently selected `language` and `length` and call `scriptGenerations.generate`. On successful generation, the dialog SHALL close, the form's `title` and `content` fields SHALL be populated with the generated draft, and the form SHALL retain the returned `generationId` for the subsequent save. The user SHALL still submit the form manually to persist the script.

#### Scenario: Open generate dialog

- **WHEN** user clicks **Generate with AI** on `/cms/scripts/new`
- **THEN** a dialog opens with prompt input

#### Scenario: Generate fills form

- **WHEN** user submits the generate dialog with a valid prompt while language and length are selected on the form
- **THEN** the form `title` and `content` fields are updated with the generated draft, a `generationId` is stored client-side, and the user can edit before saving

#### Scenario: Generate uses selected language

- **WHEN** user changes the language select to Vietnamese and generates a script
- **THEN** the generated `content` is produced for Vietnamese (`vi-VN`)

#### Scenario: Generate uses selected length

- **WHEN** user selects Long (~5 minutes) on the form length select and generates a script
- **THEN** the generation request uses `long` as the target duration

#### Scenario: Generation loading state

- **WHEN** a generate request is in progress
- **THEN** the generate action shows a loading state and cannot be submitted again until the request completes

#### Scenario: Generation error

- **WHEN** generation fails
- **THEN** an error indication is shown (e.g. toast) and the form retains its previous field values and any prior `generationId`
