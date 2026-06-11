## Why

The shared CMS page header with sidebar toggle and breadcrumbs is already live on Voices and gives consistent wayfinding across breakpoints. Topics, Scripts, and Speeches still use in-page `h1` titles and ad-hoc back links, so navigation chrome is inconsistent and mobile users on those routes lack the sidebar trigger in the header. Extending the same pattern to the remaining content sections completes the CMS shell migration started with Voices.

## What Changes

- Apply `CMSPageHeader` to **Topics**, **Scripts**, and **Speeches** list, create, and detail routes
- List pages: breadcrumb current page is the section name (**Topics**, **Scripts**, **Speeches**); remove in-page `h1` titles; keep **New …** action buttons in page content
- Create pages (`/new`): breadcrumb **Section** (link to list) → **New**; remove form back links
- Detail pages: add async nested layouts that load entity labels and render **Section** (link) → entity name; remove form/detail back links
- Update loading UIs for Topics and Speeches (and add Scripts loading if missing) to match header-driven page chrome
- No changes to `CMSPageHeader` component API, sidebar behavior, or backend APIs

## Capabilities

### New Capabilities

_None — reuses existing `cms-page-header` capability._

### Modified Capabilities

- `script-topics`: CMS Topics list, create, and detail pages use shared page header breadcrumbs instead of in-page titles and back links; loading UI aligns with header chrome
- `cms-scripts`: CMS Scripts list, create, and detail pages use shared page header breadcrumbs instead of in-page titles and back links; loading UI aligns with header chrome
- `cms-speeches`: CMS Speeches list, create, and detail pages use shared page header breadcrumbs instead of in-page titles and back links; loading UI aligns with header chrome

## Impact

- **Code**: `src/app/(cms)/cms/topics/` (pages, loading), `src/app/(cms)/cms/scripts/` (pages, loading), `src/app/(cms)/cms/speeches/` (pages, loading), nested layouts for detail routes, removal of `TopicFormBackLink`, `ScriptFormBackLink`, `SpeechCreateFormBackLink`, and `SpeechDetailBackLink` exports if unused
- **UI**: Reuses existing `CMSPageHeader` and `ROUTES.CMS.*` constants; no new components required
- **Systems**: No API, database, or env changes
