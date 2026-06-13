## MODIFIED Requirements

### Requirement: CMS speeches list page

The CMS SHALL provide a page at `/cms/speeches` that displays all speeches in a shadcn table with columns appropriate for browsing (at minimum: script title, voice name, language label, length, process status, publication status, updated date). The length column SHALL display the speech's stored `contentLength` formatted as a locale-aware integer with a "chars" suffix. The process status column SHALL display a readable label for `pending`, `processing`, `finished`, and `failed` and SHALL use a column header that distinguishes it from publication status (e.g. **Process**). The publication status column SHALL display `Not published`, `Published`, or `Unpublished` using the same labels and badge variants as the speech detail page. The page SHALL use the shared CMS page header with **Speeches** as the current breadcrumb segment instead of an in-page `h1` title. The page SHALL provide a **New speech** control below the header. The page SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: View speeches table

- **WHEN** an authenticated CMS user navigates to `/cms/speeches`
- **THEN** a table of all speeches is shown below the page header breadcrumb **Speeches**, including readable language labels, content length, process status, and publication status for each row

#### Scenario: Published speech shows live status in list

- **WHEN** an authenticated CMS user views the speeches list and a speech has publication `status` `published`
- **THEN** that row's publication column shows **Published**

#### Scenario: Unpublished speech shows hidden status in list

- **WHEN** an authenticated CMS user views the speeches list and a speech has publication `status` `unpublished`
- **THEN** that row's publication column shows **Unpublished**

#### Scenario: Draft speech shows not published in list

- **WHEN** an authenticated CMS user views the speeches list and a speech has no publication row
- **THEN** that row's publication column shows **Not published**

### Requirement: Loading UI on speeches list page

While the speeches list page is loading, the CMS SHALL display a loading UI at `/cms/speeches` that matches the list page layout: shared page header with **Speeches** breadcrumb and a table skeleton with columns for script title, voice name, language, length, process status, publication status, and updated date.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated CMS user navigates to `/cms/speeches` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with the shared page header breadcrumb **Speeches** and a table-shaped placeholder matching the speeches list columns including publication status
