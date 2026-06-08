## 1. Theme provider

- [x] 1.1 Create `src/components/theme-provider.tsx` — client wrapper around `NextThemesProvider` per shadcn docs
- [x] 1.2 Wrap `{children}` and `<Toaster />` in `ThemeProvider` inside `src/app/layout.tsx` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `disableTransitionOnChange`

## 2. Mode toggle UI

- [x] 2.1 Create `src/components/mode-toggle.tsx` — dropdown with Light, Dark, and System options using `useTheme()` and existing shadcn `Button` + `DropdownMenu`
- [x] 2.2 Add `<ModeToggle />` to `CMSSidebar` footer (usable in icon-collapsed state with tooltip)

## 3. Theme-aware client components

- [x] 3.1 Update `voice-audio-preview.tsx` to re-read CSS variables and update wavesurfer colors when `resolvedTheme` changes
- [x] 3.2 Apply the same pattern to any other waveform preview components under `cms/speeches` if present

## 4. Verification

- [x] 4.1 Manually verify light, dark, and system modes apply correct tokens across CMS pages
- [x] 4.2 Verify theme persists after page refresh and toasts match the active theme
