# cms-sidebar Specification

## Purpose

TBD - created by archiving change mobile-cms-sidebar. Update Purpose after archive.

## Requirements

### Requirement: Mobile navigation trigger

The CMS layout SHALL render a sidebar toggle in the shared CMS page header on all viewports. On viewports below the `md` breakpoint, the toggle SHALL open the CMS navigation drawer. The control SHALL use the shared `SidebarTrigger` so it toggles the mobile Sheet sidebar provided by shadcn `Sidebar`. CMS shell navigation SHALL be reachable only by authenticated CMS users (`isCmsUser === true`).

#### Scenario: Open menu on mobile

- **WHEN** an authenticated CMS user on a viewport narrower than `md` views a CMS page that uses the shared page header
- **THEN** a sidebar toggle is visible in the page header

#### Scenario: Trigger opens navigation drawer

- **WHEN** the user activates the sidebar toggle in the page header on mobile
- **THEN** the CMS sidebar appears as a left drawer overlay with the same nav items as desktop (Dashboard, Voices, Scripts, Speeches, Settings) and the user account control in the footer

#### Scenario: Desktop sidebar toggle in page header

- **WHEN** an authenticated CMS user on a viewport at or above `md` views a CMS page that uses the shared page header
- **THEN** the sidebar toggle remains visible in the page header and toggles the persistent collapsible sidebar

#### Scenario: No separate mobile branding bar

- **WHEN** an authenticated CMS user views a CMS page that uses the shared page header
- **THEN** the previous mobile-only branding header bar (app logo and title without breadcrumbs) is not shown

### Requirement: Mobile drawer closes on navigation

When the mobile navigation drawer is open, selecting a sidebar link SHALL close the drawer before or as the app navigates to the target route.

#### Scenario: Nav link closes drawer

- **WHEN** the mobile drawer is open and the user taps a sidebar navigation link
- **THEN** the drawer closes and the app navigates to the linked CMS route

### Requirement: Desktop sidebar behavior unchanged

Implementing mobile navigation SHALL NOT alter existing desktop sidebar behavior: collapsible icon mode, cookie-backed `sidebar_state` default, and Cmd/Ctrl+B keyboard toggle.

#### Scenario: Desktop collapse persists

- **WHEN** a desktop user collapses the sidebar to icon mode and reloads the page
- **THEN** the collapsed state is restored from the `sidebar_state` cookie as today

#### Scenario: Desktop keyboard shortcut

- **WHEN** a desktop user presses Cmd+B (macOS) or Ctrl+B (other platforms)
- **THEN** the sidebar toggles expanded/collapsed as today

### Requirement: CMS navigation items preserved

The mobile drawer SHALL expose the same navigation items and active-route highlighting as the desktop `CMSSidebar`, driven from a single shared menu configuration.

#### Scenario: Active route highlight in mobile drawer

- **WHEN** the user opens the mobile drawer while viewing `/cms/voices`
- **THEN** the Voices item appears active using the same path-matching rules as desktop
