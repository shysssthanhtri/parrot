## MODIFIED Requirements

### Requirement: CMS script detail page with edit form

The CMS SHALL provide a page at `/cms/scripts/[scriptId]` that loads an existing script and renders the shared form prefilled with `title`, `content`, and `language`. On successful save, the user SHALL remain on the same page and receive a success indication (e.g. toast). The page SHALL provide a **Delete script** control with a confirmation dialog that calls `scripts.delete` and, on success, navigates to `/cms/scripts` with a success toast. When the script has one or more linked speeches (`_count.speeches` greater than zero), the confirmation dialog SHALL warn the user that those speeches and their generated audio will also be permanently deleted. The page SHALL NOT show creator/`createdBy` in v1.

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
