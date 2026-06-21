## 1. Settings components

- [x] 1.1 Add `SignOutButton` client component under `settings/_components/` that calls `signOut({ callbackUrl: ROUTES.PUBLIC.SIGNIN })` from `next-auth/react`
- [x] 1.2 Add `CmsSettingsPlaceholder` component with a card and muted message that CMS settings are coming soon
- [x] 1.3 Add `SettingsTabs` client component using shadcn `Tabs` with Personal (default) and CMS triggers and content panels

## 2. Personal tab content

- [x] 2.1 Compose Personal tab with existing `ThemeSettings` card and a separate account/sign-out card containing `SignOutButton`
- [x] 2.2 Ensure Personal tab layout uses consistent spacing (`flex flex-col gap-4`) between theme and sign-out sections

## 3. Settings page integration

- [x] 3.1 Update `settings/page.tsx` to render `SettingsTabs` instead of bare `ThemeSettings`, keeping the existing page header
- [x] 3.2 Wire CMS tab content to `CmsSettingsPlaceholder`
