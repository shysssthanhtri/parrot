## ADDED Requirements

### Requirement: Loading UI on voices list page

While the voices list page is loading (server data fetch in progress), the CMS SHALL display a loading UI at `/cms/voices` that matches the list page layout: page heading area and a table skeleton with columns for name, language, description, and updated date. The loading UI SHALL appear without requiring authentication changes and SHALL be replaced by the full page once data is ready.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated user navigates to `/cms/voices` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with a table-shaped placeholder matching the voices list columns

#### Scenario: Loading resolves to list

- **WHEN** voice data finishes loading on `/cms/voices`
- **THEN** the loading UI is replaced by the voices table (or empty state)
