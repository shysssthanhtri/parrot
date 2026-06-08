## Context

The CMS settings page (`src/app/(cms)/cms/settings/page.tsx`) currently renders a page header and a single `ThemeSettings` card. Theme switching was implemented in the dark-light-theme change and lives exclusively on this page (no sidebar toggle). The sidebar footer shows `UserButton` (avatar + name/email) but has no sign-out action.

The app already has shadcn `Tabs` (`src/components/ui/tabs.tsx`), `ThemeSettings` with light/dark/system toggle, and NextAuth v5 with `signOut` exported from `src/auth.ts`. CMS routes are protected via the `authorized` callback in auth config.

## Goals / Non-Goals

**Goals:**

- Split settings into **Personal** and **CMS** tabs using shadcn `Tabs`
- Personal tab: existing `ThemeSettings` + new sign-out button
- CMS tab: placeholder card/message for future CMS configuration
- Default to Personal tab on page load
- Sign out via `signOut()` from `next-auth/react`, redirecting to the sign-in page

**Non-Goals:**

- Implementing actual CMS configuration fields (API keys, defaults, org settings, etc.)
- Moving theme control back to the sidebar
- Changing sidebar `UserButton` behavior beyond what is needed for sign-out on settings
- Server-side account management (profile editing, password, etc.)

## Decisions

### 1. Tab layout with shadcn `Tabs`

**Choice:** Add a client `SettingsTabs` component wrapping shadcn `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent`. Tab labels: "Personal" and "CMS". `defaultValue="personal"`.

**Rationale:** User requested separated sections with tabs. Tabs are already in the design system and fit a two-section settings page without nested routes or separate URLs.

**Alternatives considered:**

- Separate routes (`/cms/settings/personal`, `/cms/settings/cms`) — more navigation overhead for only two sections; tabs are sufficient for now.
- Stacked sections on one scrollable page — less clear separation as CMS settings grow.

### 2. Reuse `ThemeSettings` in Personal tab

**Choice:** Keep `ThemeSettings` as-is and compose it inside the Personal tab content, optionally wrapped with a sign-out card below it.

**Rationale:** No behavior change to theme logic; avoids duplication. Matches updated `app-theme` spec placement.

**Alternatives considered:**

- Inline theme UI in tabs component — duplicates existing card.

### 3. Sign-out as a dedicated client component

**Choice:** Add `SignOutButton` (or `AccountSettings`) under `settings/_components/` using `signOut({ callbackUrl: ROUTES.PUBLIC.SIGNIN })` from `next-auth/react`. Render as a `Button` with destructive or outline variant inside a `Card` in the Personal tab.

**Rationale:** Sign-out requires client interactivity. Isolating it keeps `SettingsTabs` focused on layout. Placing it in Personal tab groups account/session actions separately from CMS config.

**Alternatives considered:**

- Dropdown on sidebar `UserButton` — useful later but out of scope; user asked for sign-out on settings Personal tab.
- Server action calling `signOut` from `@/auth` — NextAuth client `signOut` is the established pattern with `SessionProvider` already in CMS layout.

### 4. CMS tab placeholder

**Choice:** Show a `Card` with title "CMS settings" and muted description such as "CMS configuration options will be available here soon."

**Rationale:** Sets expectations without fake controls. Easy to replace when CMS settings are defined.

**Alternatives considered:**

- Empty tab — confusing; placeholder text is clearer.

### 5. Page structure

**Choice:** Keep `page.tsx` as a server component for the static header; render `<SettingsTabs />` below in `max-w-xl` container (same width as current theme card).

**Rationale:** Matches existing layout pattern. Server header + client tabs is a standard App Router split.

## Risks / Trade-offs

- **[Sign-out discoverability]** → Sign-out moves from implicit (nowhere) to settings-only. Acceptable per user request; sidebar could add logout later if needed.
- **[Tab state not in URL]** → Refresh always returns to Personal tab. Fine for two static sections; revisit if deep-linking to CMS tab becomes important (`?tab=cms` or sub-routes).
- **[Client bundle on settings page]** → Entire settings body becomes client-driven via tabs wrapper. Small page; acceptable.

## Migration Plan

Single frontend deploy. No database or env changes.

1. Add `SettingsTabs`, `SignOutButton`, and optional `CmsSettingsPlaceholder` components
2. Update settings `page.tsx` to render tabbed layout
3. Manual smoke test: theme still works in Personal tab; sign-out ends session and redirects; CMS tab shows placeholder

Rollback: revert settings page to flat `ThemeSettings` only.

## Open Questions

None. CMS tab content will be defined in a future change when requirements are known.
