# cms-sidebar Specification

## MODIFIED Requirements

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
