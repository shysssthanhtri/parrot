## Context

Parrot is a Next.js App Router app using shadcn/ui with Tailwind v4. `globals.css` already defines `:root` (light) and `.dark` token sets, and UI components include `dark:` variants. `next-themes` is installed (`package.json`) and `Toaster` in `src/components/ui/sonner.tsx` already calls `useTheme()`, but no `ThemeProvider` is mounted in `src/app/layout.tsx`, so theme switching is non-functional.

The root layout already sets `suppressHydrationWarning` on `<html>`, which is required by `next-themes` to avoid hydration mismatches when the stored theme differs from the server render.

## Goals / Non-Goals

**Goals:**

- Follow the [shadcn Next.js dark mode guide](https://ui.shadcn.com/docs/dark-mode/next): `ThemeProvider` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`
- Persist user preference via `next-themes` (built-in `localStorage` key)
- Expose a light / dark / system toggle in the CMS shell
- Ensure Sonner toasts and waveform previews respect the active theme

**Non-Goals:**

- Per-user server-side theme storage or database field
- Separate marketing/public-site theme UI (CMS toggle is sufficient for v1; public routes still inherit system/default theme)
- Custom color palettes beyond existing `globals.css` tokens
- `prefers-color-scheme` media queries outside the `next-themes` class strategy

## Decisions

### 1. `ThemeProvider` in root layout

**Choice:** Add `src/components/theme-provider.tsx` (thin client wrapper around `NextThemesProvider`) and wrap `{children}` + `<Toaster />` inside it in `src/app/layout.tsx`.

**Rationale:** Single provider covers CMS, auth pages, and any future routes. Matches shadcn docs. `Toaster` must be a descendant of the provider for `useTheme()` to resolve.

**Alternatives considered:**

- Provider only in CMS layout — toasts on non-CMS routes would not theme correctly; splits behavior.
- Inline provider without a separate file — works but diverges from shadcn convention and registry updates.

### 2. Mode toggle via shadcn `DropdownMenu`

**Choice:** Add `src/components/mode-toggle.tsx` — icon button opening a dropdown with Light, Dark, and System options (Sun / Moon / Monitor icons), using `useTheme()` from `next-themes`.

**Rationale:** Standard shadcn pattern; supports three modes explicitly. Can be added via `npx shadcn@latest add` if a registry block exists, or hand-written to match existing `dropdown-menu` + `button` components.

**Alternatives considered:**

- Binary sun/moon toggle only — simpler but cannot re-select system after explicit light/dark.
- Settings page only — harder to discover; sidebar placement is always visible.

### 3. Toggle placement in CMS sidebar footer

**Choice:** Render `<ModeToggle />` in `CMSSidebar` footer, above or beside `UserButton`, visible in both expanded and icon-collapsed states (icon-only button when collapsed).

**Rationale:** Persistent access on every CMS page without a new header row. Footer is a natural home for shell preferences.

**Alternatives considered:**

- CMS settings page — fewer clicks to change theme; deferred unless sidebar feels crowded.
- Mobile-only header — theme is useful on desktop too.

### 4. Waveform theme reactivity

**Choice:** In `voice-audio-preview.tsx` (and any similar waveform components), subscribe to `useTheme().resolvedTheme` and re-read `--muted-foreground` / `--primary` from `getComputedStyle` when theme changes, then call wavesurfer `setOptions` for colors.

**Rationale:** Current implementation reads colors once in `useState` initializer; toggling theme leaves waveforms on stale colors. Small `useEffect` fix satisfies the spec without new abstractions.

**Alternatives considered:**

- Shared `useThemeColors()` hook — premature until a second consumer exists.

## Risks / Trade-offs

- **[Flash of wrong theme on load]** → `next-themes` injects a blocking script when configured; with `suppressHydrationWarning` and class strategy, flash is minimal. Acceptable for v1.
- **[SSR/client mismatch on first paint]** → Server renders without `dark` class; client applies stored theme. Standard `next-themes` behavior; mitigated by `disableTransitionOnChange` to avoid animated flicker.
- **[Third-party canvas colors]** → Wavesurfer reads computed colors, not Tailwind classes; must update via JS on theme change. Document pattern for future chart/canvas widgets.
- **[Icon-only collapsed sidebar]** → Toggle must remain usable as a single icon with tooltip; use `SidebarMenuButton` or `Button` with `title` / `Tooltip`.

## Migration Plan

Single frontend deploy. No migrations or env vars.

1. Add `theme-provider.tsx` and `mode-toggle.tsx`
2. Update `src/app/layout.tsx` to wrap children with `ThemeProvider`
3. Add toggle to `CMSSidebar` footer
4. Fix waveform theme subscription
5. Manual smoke test: toggle all three modes, refresh page (persistence), check toasts and voice preview

Rollback: remove provider wrapper and toggle; app returns to implicit light-only (no `dark` class applied).

## Open Questions

None for v1. If a public marketing layout is added later, consider duplicating the toggle in a shared site header.
