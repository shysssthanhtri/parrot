## Why

Topics, Scripts, and Speeches now use the shared `CMSPageHeader` with sidebar toggle and breadcrumbs, but Settings still uses an in-page title and horizontal tabs. That leaves Settings visually inconsistent and without mobile sidebar access in the header. Moving Personal and CMS into sidebar sub-items under Settings (matching common dashboard patterns) gives persistent section navigation and aligns Settings with the rest of the CMS shell.

## What Changes

- Apply `CMSPageHeader` to Settings routes with breadcrumbs: **Settings** → **Personal** or **CMS**
- Replace in-page tabs with dedicated routes: `/cms/settings/personal` (default) and `/cms/settings/cms`
- Redirect `/cms/settings` to `/cms/settings/personal`
- Update `CMSSidebar` so **Settings** is a collapsible parent with **Personal** and **CMS** sub-items (using existing shadcn `SidebarMenuSub` primitives)
- Remove `SettingsTabs` and the in-page Settings `h1`/description chrome replaced by breadcrumbs
- Add `ROUTES.CMS.SETTINGS_PERSONAL` and `ROUTES.CMS.SETTINGS_CMS` route constants
- Preserve existing Personal content (theme, sign out) and CMS placeholder content unchanged

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `cms-settings`: Replace tabbed sections with route-based Personal and CMS pages; default landing is Personal via redirect
- `cms-sidebar`: Settings nav item becomes an expandable group with Personal and CMS sub-items; active state reflects current settings sub-route
- `cms-page-header`: Settings routes adopt the shared page header with two-level breadcrumbs

## Impact

- **Code**: `src/app/(cms)/cms/settings/` (route split, layout, remove tabs), `src/app/(cms)/cms/_components/cms-sidebar.tsx`, `src/app/configs/routes.ts`
- **UI**: Reuses `CMSPageHeader`, `SidebarMenuSub`, and existing settings form components (`ThemeSettings`, `SignOutButton`, `CmsSettingsPlaceholder`)
- **Systems**: No API, database, or env changes; `/cms/settings` URL remains valid via redirect
