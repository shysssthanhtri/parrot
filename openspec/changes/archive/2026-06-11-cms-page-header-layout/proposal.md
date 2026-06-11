## Why

The CMS shell today uses a mobile-only header with app branding and a sidebar trigger, while each page renders its own `h1` title and ad-hoc back links. This splits navigation context across the layout and page content, does not match the shadcn sidebar dashboard pattern, and will not scale as more CMS sections add detail and create routes. A shared page header with sidebar toggle and breadcrumbs gives consistent wayfinding and a single place to extend shell chrome across routes.

## What Changes

- Replace the mobile-only `CMSHeader` with a shared **CMS page header** rendered in the CMS layout on all breakpoints
- Page header layout: **sidebar toggle** (left) → **breadcrumbs** (section list link, then current page label)
- Introduce a generic API (component + types) so pages declare breadcrumb items without duplicating header markup
- Apply the new header to **Voices** routes first:
  - `/cms/voices` — breadcrumb current page: **Voices**
  - `/cms/voices/[voiceId]` — **Voices** (link to list) → voice name (current page)
- Remove Voices-specific in-page title and back link that the header replaces (`h1` on list, `VoiceDetailBackLink` on detail)
- Update Voices loading UI to align with the new header-driven page chrome

## Capabilities

### New Capabilities

- `cms-page-header`: Shared CMS page header shell — sidebar toggle, breadcrumb trail, layout integration, and reusable page-level breadcrumb configuration

### Modified Capabilities

- `cms-sidebar`: Mobile navigation trigger moves from a mobile-only branding bar into the shared page header; header is visible on all breakpoints with `SidebarTrigger` toggling mobile drawer or desktop collapse
- `cms-voices`: List and detail pages use layout breadcrumbs instead of in-page `h1` / back link; loading UI reflects header-based page chrome

## Impact

- **Code**: `src/app/(cms)/cms/layout.tsx`, `cms-header.tsx` (replace/refactor), new shared page-header components under `src/app/(cms)/cms/_components/`, Voices pages and loading UI under `src/app/(cms)/cms/voices/`
- **UI**: shadcn `SidebarTrigger`, existing `Breadcrumb` components in `src/components/ui/breadcrumb.tsx`
- **Systems**: No API, database, or env changes; other CMS sections (Scripts, Speeches, Topics, Settings) unchanged in v1 but can adopt the same header API later
