# cms-page-header Specification

## Purpose

TBD - created by archiving change cms-page-header-layout. Update Purpose after archive.

## Requirements

### Requirement: CMS page header shell

The CMS layout SHALL render a shared page header bar at the top of the main content area (`SidebarInset`) on all viewports. The header SHALL contain a `SidebarTrigger` as the leftmost control and a breadcrumb trail to its right. The header SHALL use consistent shell styling (border-bottom, fixed height, horizontal padding) aligned with shadcn sidebar dashboard examples.

#### Scenario: Header visible on desktop

- **WHEN** an authenticated CMS user views any CMS page that uses the page header on a viewport at or above `md`
- **THEN** the page header bar is visible with the sidebar toggle and breadcrumb area

#### Scenario: Header visible on mobile

- **WHEN** an authenticated CMS user views any CMS page that uses the page header on a viewport narrower than `md`
- **THEN** the page header bar is visible with the sidebar toggle and breadcrumb area

#### Scenario: Sidebar toggle behavior

- **WHEN** the user activates the sidebar toggle in the page header on mobile
- **THEN** the CMS navigation drawer opens or closes using the existing shadcn `Sidebar` mobile Sheet behavior

#### Scenario: Desktop sidebar toggle behavior

- **WHEN** the user activates the sidebar toggle in the page header on desktop
- **THEN** the persistent sidebar toggles expanded/collapsed icon mode using existing shadcn `Sidebar` behavior

### Requirement: Breadcrumb trail structure

The page header breadcrumb trail SHALL support one or more segments. The first segment SHALL represent the CMS section list page (for example, **Voices** linking to `/cms/voices`). When the user is on a child route, a second segment SHALL represent the current page (for example, a voice name or **New**). The final segment SHALL render as the current page (non-link); earlier segments with an `href` SHALL render as links.

#### Scenario: List page single breadcrumb

- **WHEN** the user views a CMS section list page such as `/cms/voices`
- **THEN** the breadcrumb shows the section name as the current page with no preceding link segment

#### Scenario: Detail page two-level breadcrumb

- **WHEN** the user views a CMS detail page such as `/cms/voices/{voiceId}`
- **THEN** the breadcrumb shows the section name linking to the list route followed by the current page label (voice name)

#### Scenario: Create page two-level breadcrumb

- **WHEN** the user views a CMS create page whose section supports creation (for example, `/cms/scripts/new`)
- **THEN** the breadcrumb shows the section name linking to the list route followed by **New** as the current page

### Requirement: Reusable page header configuration

The CMS SHALL expose a reusable page header API (shared component and typed breadcrumb item shape) so individual routes declare breadcrumb content without duplicating header layout or sidebar toggle markup. Pages and nested layouts SHALL supply breadcrumb items through this API rather than rendering standalone page titles or back links for the same navigation purpose.

#### Scenario: Page declares breadcrumbs via shared API

- **WHEN** a CMS route integrates the shared page header API with breadcrumb items for that route
- **THEN** the route renders the standard header chrome without custom duplicate toggle or breadcrumb markup

#### Scenario: Other sections can adopt the same API

- **WHEN** a future CMS section (Scripts, Speeches, Topics, Settings) adopts the shared page header API
- **THEN** it can render the same header shell with section-specific breadcrumb items without changing the core header component
