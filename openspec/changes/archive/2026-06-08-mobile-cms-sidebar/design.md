## Context

The CMS shell at `src/app/(cms)/cms/layout.tsx` wraps all CMS pages in `SidebarProvider`, `CMSSidebar`, and `SidebarInset`. `CMSSidebar` uses shadcn `Sidebar` with `collapsible="icon"` and the standard nav items (Dashboard, Voices, Scripts, Speeches, Settings) plus `UserButton` in the footer.

The shared `Sidebar` component in `src/components/ui/sidebar.tsx` already detects mobile via `useIsMobile()` (breakpoint `768px`). On mobile it renders the sidebar as a left `Sheet` drawer controlled by `openMobile` / `setOpenMobile` in context. `SidebarTrigger` calls `toggleSidebar()`, which opens the mobile sheet when `isMobile` is true.

Today, no CMS route renders `SidebarTrigger`. The desktop sidebar container uses `hidden md:flex`, so below `md` the nav is entirely off-screen with no entry point. Individual CMS pages only render their own `h1` and content inside `SidebarInset`.

## Goals / Non-Goals

**Goals:**

- Provide a visible menu control on mobile CMS pages that opens the existing navigation drawer
- Preserve desktop sidebar behavior (icon collapse, `sidebar_state` cookie, keyboard shortcut Cmd/Ctrl+B)
- Close the mobile drawer after the user taps a nav link so content is immediately visible
- Keep implementation minimal — compose existing shadcn sidebar primitives, no new dependencies

**Non-Goals:**

- Redesigning desktop sidebar layout or nav item list
- Per-page custom headers (each page keeps its own `h1`; the mobile bar is a shared shell control only)
- Bottom tab bar or alternate mobile navigation pattern
- Changing the `768px` mobile breakpoint
- Settings route fix (`/settings` vs CMS routes) — out of scope unless discovered as blocking

## Decisions

### 1. Shared `CMSHeader` in the layout, not per-page

**Choice:** Add a client component `CMSHeader` rendered inside `SidebarInset` above `{children}` in `layout.tsx`.

**Rationale:** One trigger covers every CMS route automatically. Matches how `SidebarProvider` already centralizes shell state.

**Alternatives considered:**

- Adding `SidebarTrigger` to each page's title row — repetitive, easy to miss on new pages.
- Nesting trigger inside `CMSSidebar` header — trigger must live in main content area to stay visible when drawer is closed.

### 2. Mobile-only header bar

**Choice:** `CMSHeader` uses `className="flex md:hidden"` (or equivalent) so the bar and trigger only appear below `md`. Desktop users continue using the persistent sidebar and optional `SidebarRail`.

**Rationale:** Avoids duplicating a top bar on desktop where the sidebar is always reachable. Aligns with shadcn sidebar examples.

**Alternatives considered:**

- Always-visible header with trigger on all breakpoints — redundant on desktop where sidebar is fixed.

### 3. Close drawer on navigation via sidebar context

**Choice:** In `CMSSidebar`, call `setOpenMobile(false)` from `useSidebar()` when a menu `Link` is clicked (mobile only). Implement via `onClick` on `SidebarMenuButton` / `Link` without changing route structure.

**Rationale:** Standard drawer UX; shadcn context already exposes `setOpenMobile`. No router middleware required.

**Alternatives considered:**

- `usePathname` effect to close on any path change — works but fires on unrelated updates; link `onClick` is more direct.
- Leaving drawer open — obscures content after navigation.

### 4. Header content

**Choice:** Mobile header contains `SidebarTrigger` plus app title (`APP_CONFIG.TITLE`) and optional small logo, using existing tokens (`border-b`, `h-14`, `px-4`).

**Rationale:** Gives orientation when the drawer is closed; reuses branding from `CMSSidebar` header.

**Alternatives considered:**

- Trigger-only minimal bar — functional but less branded.

## Risks / Trade-offs

- **[Hydration flash]** → `useIsMobile` starts `undefined` then resolves; `SidebarTrigger` in a client header is fine; mobile bar hidden with CSS until `md` regardless of JS.
- **[Double h1 spacing]** → Mobile header adds ~56px; page `h1` blocks unchanged. Acceptable; pages already use `p-4 md:p-6`.
- **[Settings link leaves CMS shell]** → Pre-existing `Settings` item points to `/settings`; mobile drawer still closes on click. No change in this work.
- **[Focus trap in Sheet]** → Handled by shadcn `Sheet`; no custom work.

## Migration Plan

Single frontend deploy. No migrations or env vars. Rollback: remove `CMSHeader` from layout and revert `CMSSidebar` click handler.

## Open Questions

None for v1. If tablet landscape should show the desktop sidebar earlier than `md`, that would be a separate breakpoint change.
