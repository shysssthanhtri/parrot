## MODIFIED Requirements

### Requirement: Mobile navigation trigger

The CMS layout SHALL render a menu control visible only below the `md` breakpoint that opens the CMS navigation drawer. The control SHALL use the shared `SidebarTrigger` so it toggles the mobile Sheet sidebar provided by shadcn `Sidebar`. CMS shell navigation SHALL be reachable only by authenticated CMS users (`isCmsUser === true`).

#### Scenario: Open menu on mobile

- **WHEN** an authenticated CMS user on a viewport narrower than `md` views any `/cms/*` page
- **THEN** a menu trigger is visible in the CMS shell header area

#### Scenario: Trigger opens navigation drawer

- **WHEN** the user activates the menu trigger on mobile
- **THEN** the CMS sidebar appears as a left drawer overlay with the same nav items as desktop (Dashboard, Voices, Scripts, Speeches, Settings) and the user account control in the footer

#### Scenario: No mobile trigger on desktop

- **WHEN** an authenticated CMS user on a viewport at or above `md` views a CMS page
- **THEN** the mobile-only menu header bar is not shown and the persistent collapsible sidebar remains the navigation entry point
