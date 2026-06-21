## 1. Routes and constants

- [x] 1.1 Add `SETTINGS_PERSONAL` and `SETTINGS_CMS` to `src/app/configs/routes.ts`; keep `SETTINGS` for the redirect target
- [x] 1.2 Replace `src/app/(cms)/cms/settings/page.tsx` with a server redirect to `ROUTES.CMS.SETTINGS_PERSONAL`
- [x] 1.3 Create `src/app/(cms)/cms/settings/personal/page.tsx` with `CMSPageHeader` breadcrumbs **Settings** → **Personal** and existing Personal content (theme, sign out)
- [x] 1.4 Create `src/app/(cms)/cms/settings/cms/page.tsx` with `CMSPageHeader` breadcrumbs **Settings** → **CMS** and existing `CmsSettingsPlaceholder` content
- [x] 1.5 Delete `src/app/(cms)/cms/settings/_components/settings-tabs.tsx` and remove any remaining imports

## 2. Sidebar sub-navigation

- [x] 2.1 Refactor `src/app/(cms)/cms/_components/cms-sidebar.tsx` so **Settings** is a `Collapsible` group with **Personal** and **CMS** sub-items using `SidebarMenuSub` primitives
- [x] 2.2 Auto-expand the Settings group when `pathname.startsWith("/cms/settings")`; highlight the active sub-item and parent Settings row per sub-route
- [x] 2.3 Ensure sub-item links call `closeMobileSidebar` on click (same as other nav links)
