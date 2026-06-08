## 1. Theme provider

- [ ] 1.1 Create `src/components/theme-provider.tsx` — client wrapper around `NextThemesProvider` per shadcn docs
- [ ] 1.2 Wrap `{children}` and `<Toaster />` in `ThemeProvider` inside `src/app/layout.tsx` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, and `disableTransitionOnChange`

## 2. Mode toggle UI

- [ ] 2.1 Create `src/components/mode-toggle.tsx` — dropdown with Light, Dark, and System options using `useTheme()` and existing shadcn `Button` + `DropdownMenu`
- [ ] 2.2 Add `<ModeToggle />` to `CMSSidebar` footer (usable in icon-collapsed state with tooltip)

## 3. Theme-aware client components

- [ ] 3.1 Update `voice-audio-preview.tsx` to re-read CSS variables and update wavesurfer colors when `resolvedTheme` changes
- [ ] 3.2 Apply the same pattern to any other waveform preview components under `cms/speeches` if present

## 4. Verification

- [ ] 4.1 Manually verify light, dark, and system modes apply correct tokens across CMS pages
- [ ] 4.2 Verify theme persists after page refresh and toasts match the active theme
