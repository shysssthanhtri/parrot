## ADDED Requirements

### Requirement: Settings page header breadcrumbs

CMS settings sub-routes SHALL use the shared page header. `/cms/settings/personal` SHALL render breadcrumbs **Settings** (link to `/cms/settings/personal`) and **Personal** (current page). `/cms/settings/cms` SHALL render breadcrumbs **Settings** (link to `/cms/settings/personal`) and **CMS** (current page).

#### Scenario: Personal settings header

- **WHEN** an authenticated CMS user views `/cms/settings/personal`
- **THEN** the page header shows the sidebar toggle and breadcrumb trail **Settings** → **Personal**

#### Scenario: CMS settings header

- **WHEN** an authenticated CMS user views `/cms/settings/cms`
- **THEN** the page header shows the sidebar toggle and breadcrumb trail **Settings** → **CMS**
