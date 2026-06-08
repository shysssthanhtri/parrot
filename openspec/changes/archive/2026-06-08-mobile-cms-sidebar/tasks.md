## 1. Mobile header shell

- [x] 1.1 Create `src/app/(cms)/cms/_components/cms-header.tsx` as a client component with `SidebarTrigger`, app logo/title from `APP_CONFIG`, and `md:hidden` styling (`border-b`, fixed height, horizontal padding)
- [x] 1.2 Render `CMSHeader` inside `SidebarInset` above `{children}` in `src/app/(cms)/cms/layout.tsx`

## 2. Mobile drawer behavior

- [x] 2.1 In `cms-sidebar.tsx`, use `useSidebar()` and call `setOpenMobile(false)` when a nav `Link` is clicked (guard with `isMobile` if needed)
- [x] 2.2 Confirm desktop collapse, cookie restore, and Cmd/Ctrl+B shortcut still work after changes

## 3. Verification

- [x] 3.1 Resize to mobile width (or use devtools device mode): confirm menu trigger appears on `/cms/voices`, drawer opens with full nav + user button, and tapping Voices/Scripts/etc. closes drawer and navigates
- [x] 3.2 At `md` and above: confirm mobile header is hidden and persistent sidebar behaves as before
- [x] 3.3 Run `pnpm lint` and `pnpm typecheck`
