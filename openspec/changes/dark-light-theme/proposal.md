## Why

The app ships with full light and dark CSS tokens in `globals.css` and shadcn components already include `dark:` variants, but there is no way for users to switch themes. The UI is locked to the browser/OS default with no persisted preference, which hurts usability in low-light environments and for users who prefer light mode on dark system settings.

## What Changes

- Add a `ThemeProvider` wrapper (`next-themes`) in the root layout per [shadcn dark mode for Next.js](https://ui.shadcn.com/docs/dark-mode/next)
- Toggle the `dark` class on `<html>` via `attribute="class"` so existing `.dark` CSS variables apply
- Default to `system` theme with `enableSystem`, persisting the user's choice in `localStorage`
- Add a theme mode toggle (light / dark / system) accessible from the CMS shell
- Wire `Toaster` (already uses `useTheme`) through the provider so toast styling matches the active theme
- Audit client components that hardcode light-theme colors (e.g. waveform preview) to respect the active theme where needed

## Capabilities

### New Capabilities

- `app-theme`: Application-wide light/dark/system theme switching, persistence, and CMS toggle UI

### Modified Capabilities

<!-- none — existing cms-* specs describe page content, not shell theming -->

## Impact

- **Code**: `src/app/layout.tsx`, new `src/components/theme-provider.tsx`, new `src/components/mode-toggle.tsx` (or shadcn registry equivalent), CMS sidebar or settings placement for the toggle; possible small updates to `voice-audio-preview.tsx` for theme-aware waveform colors
- **Dependencies**: `next-themes` (already in `package.json`; no new install)
- **Systems**: No API, database, or env changes; purely client-side UI
