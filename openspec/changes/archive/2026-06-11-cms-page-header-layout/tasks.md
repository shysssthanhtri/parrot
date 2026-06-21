## 1. Shared page header component

- [x] 1.1 Add `CMSBreadcrumbItem` type and `CMSPageHeader` component under `src/app/(cms)/cms/_components/` using `SidebarTrigger` and shadcn `Breadcrumb` primitives
- [x] 1.2 Style the header bar to match shadcn sidebar dashboard pattern (`border-b`, fixed height, horizontal padding, toggle + breadcrumbs in one row)

## 2. CMS layout cleanup

- [x] 2.1 Remove the mobile-only `CMSHeader` usage from `src/app/(cms)/cms/layout.tsx` (refactor or replace `cms-header.tsx` so the old branding bar is no longer rendered)

## 3. Voices routes — adopt page header

- [x] 3.1 Render `CMSPageHeader` with `[{ label: "Voices" }]` on `src/app/(cms)/cms/voices/page.tsx` and remove the in-page `h1`
- [x] 3.2 Update `src/app/(cms)/cms/voices/loading.tsx` to use the same header breadcrumb and remove the standalone `h1`
- [x] 3.3 Add async `src/app/(cms)/cms/voices/[voiceId]/layout.tsx` that loads the voice name and renders `CMSPageHeader` with **Voices** → voice name breadcrumbs
- [x] 3.4 Remove `VoiceDetailBackLink` from the voice detail page and delete the export if unused
