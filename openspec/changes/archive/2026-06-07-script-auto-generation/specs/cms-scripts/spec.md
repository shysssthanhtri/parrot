## ADDED Requirements

### Requirement: AI script generation on create page

The CMS script create page (`/cms/scripts/new`) SHALL provide a **Generate with AI** control on the shared script form (create mode only). The control SHALL open a dialog where the user can enter a content `prompt` and select a target length: **Short** (~30 seconds), **Medium** (~1 minute), or **Long** (~5 minutes). Generation SHALL use the form's currently selected `language` and call `scriptGenerations.generate`. On successful generation, the dialog SHALL close, the form's `title` and `content` fields SHALL be populated with the generated draft, and the form SHALL retain the returned `generationId` for the subsequent save. The user SHALL still submit the form manually to persist the script.

#### Scenario: Open generate dialog

- **WHEN** user clicks **Generate with AI** on `/cms/scripts/new`
- **THEN** a dialog opens with prompt input and length selection

#### Scenario: Generate fills form

- **WHEN** user submits the generate dialog with a valid prompt and length while a language is selected on the form
- **THEN** the form `title` and `content` fields are updated with the generated draft, a `generationId` is stored client-side, and the user can edit before saving

#### Scenario: Generate uses selected language

- **WHEN** user changes the language select to Vietnamese and generates a script
- **THEN** the generated `content` is produced for Vietnamese (`vi-VN`)

#### Scenario: Generation loading state

- **WHEN** a generate request is in progress
- **THEN** the generate action shows a loading state and cannot be submitted again until the request completes

#### Scenario: Generation error

- **WHEN** generation fails
- **THEN** an error indication is shown (e.g. toast) and the form retains its previous field values and any prior `generationId`

## MODIFIED Requirements

### Requirement: CMS script create page

The CMS SHALL provide a page at `/cms/scripts/new` with a form to enter `title`, `content`, and `language` (shared with the detail page). The language field SHALL be a select control with exactly five options: English, Vietnamese, Chinese, Korean, and Japanese (default English). The create form SHALL additionally offer **Generate with AI** to draft `title` and `content` from a prompt and length selection. On successful save, the app SHALL redirect to `/cms/scripts/{scriptId}` for the newly created script. When the draft originated from AI generation, save SHALL pass `generationId` to link the script to its generation record.

#### Scenario: Create and redirect

- **WHEN** user submits valid title, content, and language on `/cms/scripts/new`
- **THEN** a script is created and the user is navigated to `/cms/scripts/{id}` for that script

#### Scenario: AI draft then create

- **WHEN** user generates a draft with **Generate with AI**, optionally edits the fields, and saves
- **THEN** a script is created with the final title and content, the generation record is linked via `scriptId`, and the user is navigated to `/cms/scripts/{id}`

### Requirement: Shared script form component

Create and detail pages SHALL use the same form component for `title`, `content`, and `language` fields and submit behavior, differing only in initial values and whether create or update is invoked. The `language` field SHALL be a select with the five supported options (not a free-text input). In create mode, the form SHALL include **Generate with AI**; the edit/detail form SHALL NOT include generation controls in v1.

#### Scenario: Same fields on create and edit

- **WHEN** user views `/cms/scripts/new` or `/cms/scripts/{id}` for an existing script
- **THEN** both pages present `title`, `content`, and a language select via the shared form

#### Scenario: Language select options

- **WHEN** user opens the language select on the script form
- **THEN** exactly five options are available: English, Vietnamese, Chinese, Korean, and Japanese

#### Scenario: Generate only on create

- **WHEN** user views `/cms/scripts/{id}` for an existing script
- **THEN** **Generate with AI** is not shown
