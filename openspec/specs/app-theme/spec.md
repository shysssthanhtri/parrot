# app-theme Specification

## Purpose

TBD - created by archiving change dark-light-theme. Update Purpose after archive.

## Requirements

### Requirement: Theme provider wraps the application

The application SHALL provide a client-side theme context using `next-themes` that toggles the `dark` class on the root `<html>` element via `attribute="class"`. The provider SHALL default to `system`, SHALL support `enableSystem` to follow OS preference, and SHALL persist the user's explicit choice in `localStorage`.

#### Scenario: First visit with system dark mode

- **WHEN** a user loads any page for the first time with OS dark mode enabled and no saved theme preference
- **THEN** the `dark` class is applied to `<html>` and dark CSS variables from `globals.css` are active

#### Scenario: First visit with system light mode

- **WHEN** a user loads any page for the first time with OS light mode enabled and no saved theme preference
- **THEN** the `dark` class is not applied to `<html>` and light CSS variables from `:root` are active

#### Scenario: Persisted theme overrides system

- **WHEN** a user previously selected `light` or `dark` and returns to the app
- **THEN** the saved theme is applied regardless of current OS preference

### Requirement: User can switch theme from the CMS

The CMS shell SHALL expose a theme mode control that lets authenticated users choose among `light`, `dark`, and `system`. The control SHALL be reachable without leaving CMS routes (e.g. in the sidebar footer or settings area).

#### Scenario: Switch to dark mode

- **WHEN** an authenticated user selects dark mode from the theme control
- **THEN** the `dark` class is applied to `<html>` immediately and the choice is persisted

#### Scenario: Switch to light mode

- **WHEN** an authenticated user selects light mode from the theme control
- **THEN** the `dark` class is removed from `<html>` immediately and the choice is persisted

#### Scenario: Switch to system mode

- **WHEN** an authenticated user selects system mode from the theme control
- **THEN** the theme follows the OS preference and the choice is persisted

### Requirement: Toasts match active theme

Sonner toasts SHALL use the active theme from `next-themes` so toast appearance is consistent with light or dark mode.

#### Scenario: Toast in dark mode

- **WHEN** a toast is shown while dark mode is active
- **THEN** the toast renders with dark styling

#### Scenario: Toast in light mode

- **WHEN** a toast is shown while light mode is active
- **THEN** the toast renders with light styling

### Requirement: Theme-aware client visuals

Client-rendered components that read CSS custom properties for colors (e.g. waveform previews) SHALL reflect the active theme after the user changes mode, not only the theme at first mount.

#### Scenario: Waveform updates on theme change

- **WHEN** a user toggles theme while a waveform audio preview is visible
- **THEN** waveform colors update to match the new theme's CSS variables
