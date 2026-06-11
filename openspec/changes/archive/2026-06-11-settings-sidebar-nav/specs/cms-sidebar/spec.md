## MODIFIED Requirements

### Requirement: Mobile navigation trigger

The CMS layout SHALL render a sidebar toggle in the shared CMS page header on all viewports. On viewports below the `md` breakpoint, the toggle SHALL open the CMS navigation drawer. The control SHALL use the shared `SidebarTrigger` so it toggles the mobile Sheet sidebar provided by shadcn `Sidebar`. CMS shell navigation SHALL be reachable only by authenticated CMS users (`isCmsUser === true`).

#### Scenario: Open menu on mobile

- **WHEN** an authenticated CMS user on a viewport narrower than `md` views a CMS page that uses the shared page header
- **THEN** a sidebar toggle is visible in the page header

#### Scenario: Trigger opens navigation drawer

- **WHEN** the user activates the sidebar toggle in the page header on mobile
- **THEN** the CMS sidebar appears as a left drawer overlay with the same nav items as desktop (Dashboard, Voices, Topics, Scripts, Speeches, Settings with Personal and CMS sub-items) and the user account control in the footer

#### Scenario: Desktop sidebar toggle in page header

- **WHEN** an authenticated CMS user on a viewport at or above `md` views a CMS page that uses the shared page header
- **THEN** the sidebar toggle remains visible in the page header and toggles the persistent collapsible sidebar

#### Scenario: No separate mobile branding bar

- **WHEN** an authenticated CMS user views a CMS page that uses the shared page header
- **THEN** the previous mobile-only branding header bar (app logo and title without breadcrumbs) is not shown

### Requirement: CMS navigation items preserved

The mobile drawer SHALL expose the same navigation items and active-route highlighting as the desktop `CMSSidebar`, driven from a single shared menu configuration.

#### Scenario: Active route highlight in mobile drawer

- **WHEN** the user opens the mobile drawer while viewing `/cms/voices`
- **THEN** the Voices item appears active using the same path-matching rules as desktop

## ADDED Requirements

### Requirement: Settings sidebar sub-navigation

The CMS sidebar SHALL render **Settings** as a collapsible navigation group with two sub-items: **Personal** linking to `/cms/settings/personal` and **CMS** linking to `/cms/settings/cms`. The Settings group SHALL expand automatically when the current route is under `/cms/settings`. The active sub-item SHALL reflect the current settings sub-route. The Settings parent row SHALL appear active when any settings sub-route is active.

#### Scenario: Settings group expanded on settings route

- **WHEN** an authenticated CMS user views `/cms/settings/personal` or `/cms/settings/cms`
- **THEN** the Settings group in the sidebar is expanded and shows Personal and CMS sub-items

#### Scenario: Personal sub-item active

- **WHEN** an authenticated CMS user views `/cms/settings/personal`
- **THEN** the Personal sub-item appears active and the Settings parent appears active

#### Scenario: CMS sub-item active

- **WHEN** an authenticated CMS user views `/cms/settings/cms`
- **THEN** the CMS sub-item appears active and the Settings parent appears active

#### Scenario: Sub-item navigation closes mobile drawer

- **WHEN** the mobile drawer is open and the user taps Personal or CMS under Settings
- **THEN** the drawer closes and the app navigates to the linked settings sub-route
