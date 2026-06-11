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

## 4. Verification

- [ ] 4.1 Manually verify `/cms/voices` on desktop and mobile: header shows toggle + **Voices** breadcrumb; table renders below
- [ ] 4.2 Manually verify `/cms/voices/{id}`: header shows **Voices** (link) → voice name; metadata and audio preview unchanged
- [ ] 4.3 Manually verify mobile sidebar toggle opens drawer and nav links still close the drawer
- [ ] 4.4 Manually verify desktop sidebar toggle collapses/expands the persistent sidebar (Cmd/Ctrl+B still works)
