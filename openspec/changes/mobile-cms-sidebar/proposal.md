## Why

The CMS layout uses the shadcn `Sidebar` with built-in mobile Sheet behavior, but there is no way to open navigation on viewports below the `md` breakpoint. The persistent sidebar is hidden on mobile and no menu trigger is rendered, so authenticated users cannot reach Dashboard, Voices, Scripts, Speeches, Settings, or sign out without typing URLs directly.

## What Changes

- Add a mobile-only CMS header bar with a `SidebarTrigger` (hamburger / panel icon) to open the navigation drawer
- Reuse the existing `CMSSidebar` content inside the shadcn mobile Sheet (no duplicate nav items)
- Close the mobile drawer when the user selects a navigation link
- Keep desktop sidebar behavior unchanged (collapsible icon rail, cookie-persisted open state)
- Optionally show the app title in the mobile header for context when the sidebar is closed

## Capabilities

### New Capabilities

- `cms-sidebar`: Mobile-accessible CMS navigation — trigger, drawer, link behavior, and layout integration for authenticated CMS routes

### Modified Capabilities

<!-- none — existing cms-* specs describe page content, not shell navigation -->

## Impact

- **Code**: `src/app/(cms)/cms/layout.tsx`, new `src/app/(cms)/cms/_components/cms-header.tsx` (or similar), possible small updates to `cms-sidebar.tsx` for mobile link close behavior
- **UI**: shadcn `SidebarTrigger`, existing `Sidebar` mobile Sheet path in `src/components/ui/sidebar.tsx` (no library changes expected)
- **Systems**: No API, database, or env changes; CMS auth and route structure unchanged
