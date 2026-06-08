## MODIFIED Requirements

### Requirement: Navigate to speech detail from list

The CMS SHALL render the script title in the speeches list table as a link to `/cms/speeches/{speechId}`. The link SHALL use Next.js `Link` (rendering a real anchor) and match the primary-column link pattern used on the scripts and voices list tables.

#### Scenario: Script title link opens detail

- **WHEN** user activates the script title link for a speech in the list table
- **THEN** the app navigates to the detail page for that speech's id

#### Scenario: Script title is a real anchor

- **WHEN** the speeches list table is rendered
- **THEN** each script title is an `<a>` element with `href` set to `/cms/speeches/{speechId}`

#### Scenario: Open detail in new tab

- **WHEN** user opens the script title link with a new-tab gesture (e.g. modifier-click or context menu)
- **THEN** the speech detail page opens in a new browser tab
