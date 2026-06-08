## Why

The CMS settings page currently shows only theme preferences in a single flat layout. As CMS-specific configuration grows, personal preferences (appearance, account actions) and CMS configuration need clear separation so users can find the right controls quickly and future CMS settings have a dedicated home.

## What Changes

- Restructure the CMS settings page into two tabbed sections: **Personal** and **CMS**
- **Personal** tab: keep the existing theme mode control (light / dark / system) and add a sign-out button
- **CMS** tab: placeholder content indicating CMS settings will be added later
- Use shadcn `Tabs` for section navigation; default to the Personal tab
- Extract sign-out into a reusable client component that calls NextAuth `signOut`

## Capabilities

### New Capabilities

- `cms-settings`: Tabbed CMS settings page with Personal (theme + sign out) and CMS (placeholder) sections

### Modified Capabilities

- `app-theme`: Clarify that the theme mode control lives in the Personal tab of CMS settings (still reachable without leaving CMS routes)

## Impact

- **Code**: `src/app/(cms)/cms/settings/page.tsx`, new tab/section components under `settings/_components/`, new sign-out component; existing `ThemeSettings` reused in Personal tab
- **Dependencies**: No new packages; uses existing `next-themes`, `next-auth/react`, and shadcn `Tabs`
- **Systems**: No API, database, or env changes; client-side UI only
