## Context

The CMS shell at `src/app/(cms)/cms/layout.tsx` wraps pages in `SidebarProvider`, `CMSSidebar`, and `SidebarInset`. A `CMSHeader` client component renders today inside `SidebarInset`, but only on mobile (`md:hidden`). It shows `SidebarTrigger`, app logo, and title — no breadcrumbs.

Individual CMS pages render their own page chrome: list pages use an `h1` (for example, **Voices** in `voices/page.tsx`), and detail pages use ad-hoc back links (for example, `VoiceDetailBackLink`). The shadcn sidebar dashboard reference places a persistent header row in the main inset with `SidebarTrigger` and breadcrumbs on all breakpoints.

Existing primitives: `SidebarTrigger` and shadcn `Breadcrumb` components (`src/components/ui/breadcrumb.tsx`) are already in the repo. `ROUTES.CMS.VOICES` and other CMS routes live in `src/app/configs/routes.ts`.

## Goals / Non-Goals

**Goals:**

- Introduce a reusable **CMS page header** with sidebar toggle + breadcrumbs, visually integrated with the CMS shell
- Ship the pattern on **Voices** list and detail routes first
- Remove redundant Voices in-page title and back link replaced by breadcrumbs
- Keep desktop sidebar behavior unchanged (icon collapse, cookie, Cmd/Ctrl+B)
- Keep mobile drawer close-on-nav behavior in `CMSSidebar`

**Non-Goals:**

- Migrating Scripts, Speeches, Topics, Settings, or Dashboard to the new header in this change
- Changing sidebar nav items, breakpoints, or auth
- Adding create-route breadcrumbs for Voices (no `/cms/voices/new` today)
- Breadcrumb ellipsis / deep nesting beyond two levels in v1

## Decisions

### 1. Shared `CMSPageHeader` component with breadcrumb props

**Choice:** Add `CMSPageHeader` (and a small `CMSBreadcrumbItem` type) under `src/app/(cms)/cms/_components/`. It renders `SidebarTrigger` plus shadcn `Breadcrumb` from a `breadcrumbs: { label: string; href?: string }[]` prop.

**Rationale:** Explicit props work with Server Components, avoid breadcrumb flash from client-only context, and keep the API obvious for future sections. Matches the user's request for a generic pattern other pages can adopt by passing items.

**Alternatives considered:**

- React context set from client effects — causes hydration/flash and harder to test.
- Hardcoded breadcrumbs only in root layout — cannot express per-page labels (voice name) without parallel routes.
- Per-page duplicate header markup — violates DRY and the generic requirement.

### 2. Pages and nested layouts render the header, not a global empty shell

**Choice:** Remove the old mobile-only `CMSHeader` from root `layout.tsx`. Voices routes render `CMSPageHeader` at the top of their content tree:

- `voices/page.tsx` and `voices/loading.tsx`: `[{ label: "Voices" }]`
- `voices/[voiceId]/layout.tsx` (new async layout): fetch voice name server-side, render `[{ label: "Voices", href: ROUTES.CMS.VOICES }, { label: voice.name }]`, then `{children}`

**Rationale:** Server layouts can load dynamic breadcrumb labels without client state. List and loading pages stay simple. Other CMS sections keep current chrome until they opt in — no forced empty header on every route.

**Alternatives considered:**

- Header always in root layout with context — more moving parts for v1.
- Header only in `voices/layout.tsx` with pathname-based client logic — couples generic component to Voices-specific routing.

### 3. Replace Voices page chrome, do not duplicate

**Choice:** Remove the list page `h1` **Voices** and remove `VoiceDetailBackLink` from the detail page (delete export if unused). Page body padding stays; header sits above content inside the same inset padding pattern (`border-b` header full width, content `p-4 md:p-6`).

**Rationale:** Breadcrumbs subsume title and back navigation for Voices. Avoids two competing labels for the same context.

### 4. Header styling aligned with shadcn sidebar example

**Choice:** Header bar uses `flex h-16 shrink-0 items-center gap-2 border-b px-4` (or equivalent existing tokens). Breadcrumb separators use shadcn `BreadcrumbSeparator`. Current page segment uses `BreadcrumbPage`; link segments use `BreadcrumbLink` + Next.js `Link`.

**Rationale:** Matches the reference screenshot and existing design system.

### 5. Preserve mobile drawer behavior

**Choice:** No changes to `CMSSidebar` link `onClick` close behavior or `SidebarProvider` cookie defaults. Only the trigger moves from the old mobile branding bar into `CMSPageHeader`.

**Rationale:** Mobile nav requirements in `cms-sidebar` remain satisfied; trigger location changes only.

## Risks / Trade-offs

- **[Other CMS pages lack header until migrated]** → Acceptable for v1; only Voices adopts the header. Other routes lose the old mobile branding bar but retain desktop sidebar; mobile users on non-Voices pages temporarily have no header trigger until those sections migrate. **Mitigation:** Follow-up changes can add `CMSPageHeader` to remaining sections quickly using the same API; optionally add a minimal root-level trigger-only bar in a fast follow if needed.
- **[Duplicate fetch on voice detail]** → `[voiceId]/layout.tsx` may fetch voice name while `page.tsx` also loads voice data. **Mitigation:** Accept for v1; dedupe later with React `cache()` on the data loader if needed.
- **[Loading UI drift]** → `voices/loading.tsx` must mirror header breadcrumbs. **Mitigation:** Use the same `CMSPageHeader` props as the list page.

## Migration Plan

Single frontend deploy. No DB or env changes.

1. Add `CMSPageHeader` + types.
2. Remove old `CMSHeader` from root layout (or refactor file in place).
3. Wire Voices list, loading, and detail layout.
4. Remove redundant Voices title/back link.
5. Manual QA on mobile and desktop for Voices routes.

Rollback: restore `CMSHeader` in layout and revert Voices page changes.

## Open Questions

None for v1. If product wants a root-level header on all CMS routes before section migration, a follow-up can render `CMSPageHeader` with a default Dashboard-only breadcrumb in `cms/layout.tsx`.
