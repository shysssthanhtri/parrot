## ADDED Requirements

### Requirement: Static landing page rendering

The marketing landing page at `/` SHALL be statically generated at build time. The `(marketing)` route group SHALL NOT call `auth()` or other per-request dynamic data sources in its layout or page components.

#### Scenario: Landing page is statically prerendered

- **WHEN** the application is built for production
- **THEN** `/` is emitted as static HTML without requiring a server session lookup per request

#### Scenario: Guest and signed-in users see the same landing HTML

- **WHEN** any user navigates to `/`
- **THEN** the same static marketing content is served regardless of authentication state

## MODIFIED Requirements

### Requirement: Landing page site header

The landing page SHALL include a site header with the Parrot brand name or logo and a primary navigation control labeled **Go to learner space** that links to `/learn`. The header SHALL NOT display sign-in, sign-up, or sign-out controls on the marketing landing route.

#### Scenario: Header shows learner space entry point

- **WHEN** a user views the landing page header
- **THEN** a **Go to learner space** control is visible in the top-right navigation area

#### Scenario: Header link targets learner space

- **WHEN** a user activates **Go to learner space** from the landing page header
- **THEN** the app navigates to `/learn`

### Requirement: Landing page hero section

The landing page SHALL include a hero section above the fold with a learner-focused headline, supporting subheadline, and a static primary call-to-action. The primary CTA SHALL navigate to sign-up and SHALL NOT vary based on session state. The hero SHALL use shadcn/ui components and project theme tokens.

#### Scenario: Hero displays learner value proposition

- **WHEN** a user views `/`
- **THEN** a hero section with headline, subheadline, and primary CTA is visible without scrolling on typical desktop viewports

#### Scenario: Primary CTA navigates to signup

- **WHEN** a user activates the hero primary call-to-action
- **THEN** the app navigates to `/signup`
