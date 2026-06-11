## REMOVED Requirements

### Requirement: Settings page uses tabbed sections

**Reason**: Personal and CMS are now separate routes navigated via sidebar sub-items and breadcrumbs instead of in-page tabs.

**Migration**: Users visiting `/cms/settings` are redirected to `/cms/settings/personal`. Sidebar **Settings** expands to show **Personal** and **CMS** sub-links.

## ADDED Requirements

### Requirement: Settings uses route-based sections

The CMS settings area SHALL expose two routes: `/cms/settings/personal` and `/cms/settings/cms`. Navigating to `/cms/settings` SHALL redirect to `/cms/settings/personal`. The settings area SHALL be accessible only to authenticated CMS users (`isCmsUser === true`).

#### Scenario: Default section via redirect

- **WHEN** an authenticated CMS user navigates to `/cms/settings`
- **THEN** the user is redirected to `/cms/settings/personal` and Personal settings content is shown

#### Scenario: Personal route

- **WHEN** an authenticated CMS user navigates to `/cms/settings/personal`
- **THEN** Personal settings content is shown

#### Scenario: CMS route

- **WHEN** an authenticated CMS user navigates to `/cms/settings/cms`
- **THEN** CMS settings content is shown

### Requirement: Settings pages use shared page header

Each settings sub-route SHALL render the shared CMS page header with a two-level breadcrumb: **Settings** (link to `/cms/settings/personal`) followed by **Personal** or **CMS** as the current segment. The page SHALL NOT render a standalone in-page `h1` title or horizontal tab list for section switching.

#### Scenario: Personal breadcrumb

- **WHEN** an authenticated CMS user views `/cms/settings/personal`
- **THEN** the page header shows **Settings** linking to `/cms/settings/personal` and **Personal** as the current breadcrumb segment

#### Scenario: CMS breadcrumb

- **WHEN** an authenticated CMS user views `/cms/settings/cms`
- **THEN** the page header shows **Settings** linking to `/cms/settings/personal` and **CMS** as the current breadcrumb segment

### Requirement: Personal section contains theme and sign out

The Personal settings route SHALL include the theme mode control (light, dark, system) and a sign-out action for the authenticated CMS user.

#### Scenario: Theme control on Personal route

- **WHEN** an authenticated CMS user views `/cms/settings/personal`
- **THEN** the theme mode control is visible and functional

#### Scenario: Sign out from Personal route

- **WHEN** an authenticated CMS user clicks the sign-out control on `/cms/settings/personal`
- **THEN** the user session is ended and the user is redirected away from CMS routes

### Requirement: CMS section is a placeholder

The CMS settings route SHALL display placeholder content indicating that CMS-specific settings will be added in a future update. It SHALL NOT expose incomplete or non-functional configuration controls.

#### Scenario: CMS placeholder visible

- **WHEN** an authenticated CMS user navigates to `/cms/settings/cms`
- **THEN** placeholder messaging is shown and no editable CMS configuration fields are present
