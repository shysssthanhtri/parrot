## MODIFIED Requirements

### Requirement: User can switch theme from the CMS

The CMS shell SHALL expose a theme mode control that lets authenticated users choose among `light`, `dark`, and `system`. The control SHALL be reachable without leaving CMS routes in the **Personal** tab of the CMS settings page.

#### Scenario: Switch to dark mode

- **WHEN** an authenticated user selects dark mode from the theme control on the Personal settings tab
- **THEN** the `dark` class is applied to `<html>` immediately and the choice is persisted

#### Scenario: Switch to light mode

- **WHEN** an authenticated user selects light mode from the theme control on the Personal settings tab
- **THEN** the `dark` class is removed from `<html>` immediately and the choice is persisted

#### Scenario: Switch to system mode

- **WHEN** an authenticated user selects system mode from the theme control on the Personal settings tab
- **THEN** the theme follows the OS preference and the choice is persisted
