## Context

`CMSPageHeader` is live on Voices, Topics, Scripts, and Speeches. Settings at `/cms/settings` still renders an in-page `h1`, description, and `SettingsTabs` (Personal / CMS horizontal tabs). The sidebar lists Settings as a single flat link to `/cms/settings`.

`CMSSidebar` uses a flat `menuItems` array with `SidebarMenuButton` links. The shadcn sidebar primitives already export `SidebarMenuSub`, `SidebarMenuSubItem`, and `SidebarMenuSubButton`, plus `Collapsible` is available in `@/components/ui/collapsible`. No nested nav pattern exists in the codebase yet.

Existing settings content components (`ThemeSettings`, `SignOutButton`, `CmsSettingsPlaceholder`) remain valid; only navigation chrome changes.

## Goals / Non-Goals

**Goals:**

- Apply `CMSPageHeader` to Settings with two-level breadcrumbs (**Settings** → **Personal** or **CMS**)
- Replace tabs with URL-based sections at `/cms/settings/personal` and `/cms/settings/cms`
- Redirect `/cms/settings` to `/cms/settings/personal` (preserves bookmarked base URL)
- Add collapsible Settings group in `CMSSidebar` with Personal and CMS sub-items, auto-expanded when on a settings sub-route
- Preserve Personal (theme, sign out) and CMS placeholder behavior unchanged

**Non-Goals:**

- Changing `CMSPageHeader` component API or styling
- Adding CMS configuration fields beyond the existing placeholder
- Migrating Dashboard
- Deep-linking tab state via query params (routes replace client tab state)

## Decisions

### 1. Route-based sections instead of tabs

**Choice:** Split settings into `/cms/settings/personal` and `/cms/settings/cms`. Root `/cms/settings` redirects to Personal via Next.js `redirect()` in `page.tsx`.

**Alternatives considered:**

- Keep single route with hash/query (`?section=cms`) — rejected; sidebar sub-items map naturally to distinct routes and enable shareable URLs
- Keep tabs alongside sidebar sub-items — rejected; duplicate navigation affordances

**Rationale:** Matches sidebar sub-item pattern from shadcn dashboard examples; breadcrumb second segment aligns with active sub-route.

### 2. Page-level headers per sub-route

**Choice:** Each sub-route page (`personal/page.tsx`, `cms/page.tsx`) renders its own `CMSPageHeader`:

| Route                    | Breadcrumbs                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| `/cms/settings/personal` | `[{ label: "Settings", href: personal }, { label: "Personal" }]` |
| `/cms/settings/cms`      | `[{ label: "Settings", href: personal }, { label: "CMS" }]`      |

Settings first segment links to Personal (default section) rather than the redirect-only `/cms/settings` path.

**Rationale:** Same pattern as Topics/Scripts create and detail pages; no shared async layout needed.

### 3. Collapsible Settings in sidebar using Collapsible + SidebarMenuSub

**Choice:** Replace the flat Settings menu entry with a `Collapsible` group:

- Parent row: Settings icon + label + chevron; not a direct navigation link
- Sub-items: Personal → `/cms/settings/personal`, CMS → `/cms/settings/cms`
- `defaultOpen` (or controlled `open`) is `true` when `pathname.startsWith("/cms/settings")`
- Sub-item `isActive` uses exact path match; parent Settings row is active when any settings sub-route matches

**Alternatives considered:**

- Always-visible sub-items without collapsible — rejected; inconsistent with reference UI and wastes space when user is not in settings
- Parent links to `/cms/settings` (redirect) — rejected; clicking parent would navigate away from CMS sub-section context

**Rationale:** Matches attached reference (Settings → General, Team, Billing, Limits). Uses existing primitives without new dependencies.

### 4. Extract personal and CMS content from SettingsTabs

**Choice:** Delete `SettingsTabs`. Move tab panel content into dedicated page components (inline or small `_components/personal-settings.tsx` / `_components/cms-settings.tsx` wrappers reusing existing child components).

**Rationale:** Minimal diff; avoids a client wrapper solely for routing.

### 5. Route constants

**Choice:** Add to `ROUTES.CMS`:

```ts
SETTINGS_PERSONAL: `${ROOT_ROUTES.CMS}/settings/personal`,
SETTINGS_CMS: `${ROOT_ROUTES.CMS}/settings/cms`,
```

Keep existing `SETTINGS` for redirect target and backward compatibility.

## Risks / Trade-offs

- **[Icon-collapsed sidebar hides sub-items]** → `SidebarMenuSub` is hidden in icon mode by design. **Mitigation:** Acceptable; users expand sidebar or use breadcrumbs/header on settings pages.
- **[Settings parent not clickable]** → Users cannot one-click go to "settings home" from sidebar parent. **Mitigation:** Sub-items are visible when expanded; Personal is one click and is the default section.
- **[Bookmarked `/cms/settings` extra redirect]** → One additional navigation hop. **Mitigation:** Fast server redirect; preserves old URL.

## Migration Plan

Single frontend deploy. No DB or env changes.

1. Add route constants and new settings sub-routes with redirect
2. Update `CMSSidebar` collapsible Settings group
3. Remove `SettingsTabs` and old single-page chrome
4. Manual QA: sidebar expand/collapse, sub-item active states, mobile drawer, breadcrumbs, theme/sign-out, CMS placeholder

Rollback: revert route and sidebar files; restore `SettingsTabs`.

## Open Questions

None.
