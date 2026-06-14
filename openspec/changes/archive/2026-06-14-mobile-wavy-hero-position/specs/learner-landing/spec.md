## MODIFIED Requirements

### Requirement: Landing page hero section

The landing page SHALL include a hero section above the fold with a learner-focused headline, supporting subheadline, and a static primary call-to-action. The primary CTA SHALL navigate to sign-up and SHALL NOT vary based on session state. The hero SHALL use shadcn/ui components and project theme tokens. The hero SHALL retain its concentric-circle ring decoration. Beneath the rings and all hero content, the hero SHALL display an animated wavy canvas effect (Aceternity Wavy Background pattern) as the bottom background layer. The wavy effect SHALL remain readable in both light and dark themes and SHALL NOT obscure the circle rings or foreground content. On viewports below the `md` breakpoint, the wavy effect SHALL be vertically anchored behind the hero description subheadline. On viewports at or above the `md` breakpoint, the wavy effect SHALL remain vertically anchored behind the hero image area.

#### Scenario: Hero displays learner value proposition

- **WHEN** a user views `/`
- **THEN** a hero section with headline, subheadline, and primary CTA is visible without scrolling on typical desktop viewports

#### Scenario: Primary CTA navigates to signup

- **WHEN** a user activates the hero primary call-to-action
- **THEN** the app navigates to `/signup`

#### Scenario: Hero has animated wavy background

- **WHEN** a user views the landing page hero on a JavaScript-enabled browser
- **THEN** an animated wavy background is visible beneath the hero content and circle rings

#### Scenario: Hero wavy background visible on mobile behind description

- **WHEN** a user views the landing page hero on a viewport below the `md` breakpoint with JavaScript enabled
- **THEN** the animated wavy background is visible behind the hero description subheadline and remains beneath all foreground hero content

#### Scenario: Hero wavy background visible on desktop behind image

- **WHEN** a user views the landing page hero on a viewport at or above the `md` breakpoint with JavaScript enabled
- **THEN** the animated wavy background is visible behind the hero image area and remains beneath all foreground hero content

#### Scenario: Hero retains circle ring decoration

- **WHEN** a user views the landing page hero
- **THEN** the concentric-circle ring decoration is visible above the wavy background and behind the headline

#### Scenario: Hero background respects theme

- **WHEN** a user toggles between light and dark theme while viewing `/`
- **THEN** the wavy background fill and wave colors remain legible and consistent with the active theme
