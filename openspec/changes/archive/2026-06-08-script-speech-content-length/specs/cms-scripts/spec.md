## MODIFIED Requirements

### Requirement: CMS scripts list page

The CMS SHALL provide a page at `/cms/scripts` that displays all scripts in a shadcn table with columns appropriate for browsing (at minimum: title, language, length, content snippet, updated date). The language column SHALL display a human-readable label (English, Vietnamese, Chinese, Korean, or Japanese). The length column SHALL display the script's stored `contentLength` formatted as a locale-aware integer with a "chars" suffix (e.g. `1,234 chars`). The page SHALL be behind existing CMS authentication.

#### Scenario: View scripts table

- **WHEN** an authenticated user navigates to `/cms/scripts`
- **THEN** a table of all scripts is shown including language and length columns with readable labels for each row
