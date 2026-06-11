## Context

`CMSPageHeader` and the Voices migration are complete: list pages render a single breadcrumb segment, detail routes use async nested layouts for dynamic labels, and loading UIs mirror the header chrome. Topics, Scripts, and Speeches still use in-page `h1` titles and exported back-link components (`TopicFormBackLink`, `ScriptFormBackLink`, `SpeechCreateFormBackLink`, `SpeechDetailBackLink`). Topics and Speeches have `loading.tsx` files with standalone headings; Scripts has no list loading UI yet.

`ROUTES.CMS.TOPICS`, `ROUTES.CMS.SCRIPTS`, and `ROUTES.CMS.SPEECHES` already exist in `src/app/configs/routes.ts`.

## Goals / Non-Goals

**Goals:**

- Apply the established Voices page-header pattern to Topics, Scripts, and Speeches (list, create, detail)
- Remove redundant in-page titles and back links replaced by breadcrumbs
- Align loading UIs with header-driven chrome (add Scripts loading UI)
- Keep **New …** action buttons in page content below the header on list pages

**Non-Goals:**

- Changing `CMSPageHeader` component API or styling
- Migrating Settings or Dashboard
- Deduplicating server fetches between detail layouts and pages (acceptable v1 trade-off, same as Voices)
- Adding breadcrumbs deeper than two levels

## Decisions

### 1. Mirror the Voices route structure per section

**Choice:** For each section:

| Route                          | Header location        | Breadcrumbs                                                  |
| ------------------------------ | ---------------------- | ------------------------------------------------------------ |
| List (`/cms/{section}`)        | Page + `loading.tsx`   | `[{ label: "Section" }]`                                     |
| Create (`/cms/{section}/new`)  | Page                   | `[{ label: "Section", href: list }, { label: "New" }]`       |
| Detail (`/cms/{section}/[id]`) | New async `layout.tsx` | `[{ label: "Section", href: list }, { label: entityLabel }]` |

Entity labels: topic `name`, script `title`, speech linked `script.title`.

**Rationale:** Proven pattern from Voices; server layouts handle dynamic labels without client flash.

### 2. Keep list-page action buttons in content area

**Choice:** After adding `CMSPageHeader`, list pages retain the flex row with **New topic** / **New script** / **New speech** below the header (not inside the header bar).

**Rationale:** Matches current UX and avoids expanding header API for actions; Voices has no create route so this is new but consistent with existing button placement.

### 3. Remove back-link exports when unused

**Choice:** Delete `TopicFormBackLink`, `ScriptFormBackLink`, `SpeechCreateFormBackLink`, and `SpeechDetailBackLink` components and their imports once breadcrumbs replace them.

**Rationale:** Avoid dead code and duplicate navigation affordances.

### 4. Add Scripts list loading UI

**Choice:** Create `src/app/(cms)/cms/scripts/loading.tsx` following the Voices/Topics table-skeleton pattern with `CMSPageHeader` and **Scripts** breadcrumb.

**Rationale:** Scripts is the only section of the three missing a loading UI; parity prevents layout shift on navigation.

### 5. Speech detail layout fetches script title server-side

**Choice:** `[speechId]/layout.tsx` calls `speeches.getById` server-side and uses `speech.script.title` for the breadcrumb label, matching the list table's primary identifier.

**Rationale:** Consistent with how users identify speeches in the list; server fetch in layout matches Voices pattern even though detail content loads client-side.

## Risks / Trade-offs

- **[Duplicate fetch on detail routes]** → Layout and page may both load the same entity. **Mitigation:** Accept for v1 (same as Voices); optional `cache()` follow-up.
- **[Speech detail client loading state]** → Header shows script title from layout while body may still spinner-load. **Mitigation:** Acceptable; label is stable once layout resolves; same class of issue as any async layout.
- **[Mobile users on unmigrated Settings/Dashboard]** → Unchanged from post-Voices state. **Mitigation:** Out of scope; Settings can follow same pattern later.

## Migration Plan

Single frontend deploy. No DB or env changes.

1. Topics: list, loading, new, detail layout, remove back links
2. Scripts: list, new loading UI, new, detail layout, remove back links
3. Speeches: list, loading, new, detail layout, remove back links
4. Manual QA on all three sections (desktop + mobile)

Rollback: revert route files and restore back-link components.

## Open Questions

None.
