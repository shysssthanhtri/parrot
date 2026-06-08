## ADDED Requirements

### Requirement: Settings page uses tabbed sections

The CMS settings page SHALL present two tabbed sections: **Personal** and **CMS**. The Personal tab SHALL be selected by default when the page loads.

#### Scenario: Default tab on load

- **WHEN** an authenticated user navigates to CMS settings
- **THEN** the Personal tab is active and its content is visible

#### Scenario: Switch to CMS tab

- **WHEN** an authenticated user selects the CMS tab
- **THEN** the CMS tab content is shown and the Personal tab content is hidden

#### Scenario: Switch back to Personal tab

- **WHEN** an authenticated user selects the Personal tab after viewing CMS
- **THEN** the Personal tab content is shown and the CMS tab content is hidden

### Requirement: Personal tab contains theme and sign out

The Personal tab SHALL include the theme mode control (light, dark, system) and a sign-out action for the authenticated user.

#### Scenario: Theme control in Personal tab

- **WHEN** an authenticated user views the Personal tab on CMS settings
- **THEN** the theme mode control is visible and functional

#### Scenario: Sign out from Personal tab

- **WHEN** an authenticated user clicks the sign-out control on the Personal tab
- **THEN** the user session is ended and the user is redirected away from authenticated CMS routes

### Requirement: CMS tab is a placeholder

The CMS tab SHALL display placeholder content indicating that CMS-specific settings will be added in a future update. It SHALL NOT expose incomplete or non-functional configuration controls.

#### Scenario: CMS tab placeholder visible

- **WHEN** an authenticated user selects the CMS tab
- **THEN** placeholder messaging is shown and no editable CMS configuration fields are present
