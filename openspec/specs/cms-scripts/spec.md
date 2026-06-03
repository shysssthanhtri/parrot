# cms-scripts Specification

## Purpose
TBD - created by archiving change scripts. Update Purpose after archive.

## Requirements

### Requirement: CMS scripts list page

The CMS SHALL provide a page at `/cms/scripts` that displays all scripts in a shadcn table with columns appropriate for browsing (at minimum: title, content snippet, updated date). The page SHALL be behind existing CMS authentication.

#### Scenario: View scripts table

- **WHEN** an authenticated user navigates to `/cms/scripts`
- **THEN** a table of all scripts is shown

### Requirement: New script entry from list

The CMS scripts list page SHALL provide a control (e.g. **New script** button) that navigates to `/cms/scripts/new`.

#### Scenario: Open create page

- **WHEN** user clicks the new-script control on the list page
- **THEN** the app navigates to `/cms/scripts/new`

### Requirement: Navigate to script detail from list

The CMS SHALL allow clicking a script table row to navigate to `/cms/scripts/{scriptId}`.

#### Scenario: Row click opens detail

- **WHEN** user clicks a script row in the list table
- **THEN** the app navigates to the detail page for that script's id

### Requirement: CMS script create page

The CMS SHALL provide a page at `/cms/scripts/new` with a form to enter `title` and `content` (shared with the detail page). On successful save, the app SHALL redirect to `/cms/scripts/{scriptId}` for the newly created script.

#### Scenario: Create and redirect

- **WHEN** user submits valid title and content on `/cms/scripts/new`
- **THEN** a script is created and the user is navigated to `/cms/scripts/{id}` for that script

### Requirement: CMS script detail page with edit form

The CMS SHALL provide a page at `/cms/scripts/[scriptId]` that loads an existing script and renders the shared form prefilled with `title` and `content`. On successful save, the user SHALL remain on the same page and receive a success indication (e.g. toast). The page SHALL NOT show creator/`createdBy` in v1.

#### Scenario: Edit and stay

- **WHEN** user updates fields and saves on `/cms/scripts/{id}` for an existing script
- **THEN** the script is updated, the user stays on `/cms/scripts/{id}`, and a success indication is shown

#### Scenario: Script not found

- **WHEN** user opens `/cms/scripts/{id}` for a non-existent script
- **THEN** a not-found UI is shown

### Requirement: Shared script form component

Create and detail pages SHALL use the same form component for `title` and `content` fields and submit behavior, differing only in initial values and whether create or update is invoked.

#### Scenario: Same fields on create and edit

- **WHEN** user views `/cms/scripts/new` or `/cms/scripts/{id}` for an existing script
- **THEN** both pages present `title` and `content` inputs via the shared form
