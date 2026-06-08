# cms-sidebar Specification

## Purpose

TBD - created by archiving change mobile-cms-sidebar. Update Purpose after archive.

## Requirements

### Requirement: Mobile navigation trigger

The CMS layout SHALL render a menu control visible only below the `md` breakpoint that opens the CMS navigation drawer. The control SHALL use the shared `SidebarTrigger` so it toggles the mobile Sheet sidebar provided by shadcn `Sidebar`.

#### Scenario: Open menu on mobile

- **WHEN** an authenticated user on a viewport narrower than `md` views any `/cms/*` page
- **THEN** a menu trigger is visible in the CMS shell header area

#### Scenario: Trigger opens navigation drawer

- **WHEN** the user activates the menu trigger on mobile
- **THEN** the CMS sidebar appears as a left drawer overlay with the same nav items as desktop (Dashboard, Voices, Scripts, Speeches, Settings) and the user account control in the footer

#### Scenario: No mobile trigger on desktop

- **WHEN** an authenticated user on a viewport at or above `md` views a CMS page
- **THEN** the mobile-only menu header bar is not shown and the persistent collapsible sidebar remains the navigation entry point

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
