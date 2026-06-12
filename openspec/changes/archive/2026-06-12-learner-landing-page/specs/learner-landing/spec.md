## ADDED Requirements

### Requirement: Public marketing landing page

The app SHALL provide a learner-focused marketing landing page at `/` outside the CMS layout. The page SHALL NOT require authentication to view. Signed-in users MAY view the landing page without being redirected.

#### Scenario: Guest views landing page

- **WHEN** an unauthenticated user navigates to `/`
- **THEN** the marketing landing page is displayed without redirecting to sign-in

#### Scenario: Signed-in user views landing

- **WHEN** an authenticated user navigates to `/`
- **THEN** the marketing landing page is displayed without redirecting to `/learn`

#### Scenario: Landing route constant

- **WHEN** application code references the public landing route
- **THEN** `ROUTES.PUBLIC.HOME` resolves to `/`

### Requirement: Landing page site header

The landing page SHALL include a site header with the Parrot brand name or logo and navigation to sign-in and sign-up for unauthenticated users. Sign-in links SHALL include a post-auth callback to the learner space (`/learn`).

#### Scenario: Header auth links for guests

- **WHEN** an unauthenticated user views the landing page header
- **THEN** controls to navigate to sign-in and sign-up are visible

#### Scenario: Sign-in callback targets learner space

- **WHEN** a user activates sign-in from the landing page
- **THEN** Auth.js is invoked with a callback URL of `/learn`

### Requirement: Landing page hero section

The landing page SHALL include a hero section above the fold with a learner-focused headline, supporting subheadline, and a primary call-to-action. For guests, the CTA SHALL navigate to sign-up; for signed-in users, the CTA MAY navigate to the learner space. The hero SHALL use shadcn/ui components and project theme tokens.

#### Scenario: Hero displays learner value proposition

- **WHEN** a user views `/`
- **THEN** a hero section with headline, subheadline, and primary CTA is visible without scrolling on typical desktop viewports

#### Scenario: Primary CTA for guests navigates to signup

- **WHEN** a guest activates the hero primary call-to-action
- **THEN** the app navigates to `/signup`

#### Scenario: Primary CTA for signed-in users navigates to learner space

- **WHEN** a signed-in user activates the hero primary call-to-action
- **THEN** the app navigates to `/learn`

### Requirement: Landing page how-it-works section

The landing page SHALL include a static "How it works" section below the hero describing the shadowing flow in three steps (browse speeches, listen and follow along, practice out loud). The section SHALL NOT require authentication or live catalog data.

#### Scenario: How-it-works visible on landing

- **WHEN** an unauthenticated user scrolls the landing page
- **THEN** a three-step how-it-works section is displayed below the hero

### Requirement: Landing page metadata

The app SHALL expose Parrot-specific document metadata for the landing page, including a title and description suitable for end-user learners (not CMS operators).

#### Scenario: Landing page title

- **WHEN** an unauthenticated user loads `/`
- **THEN** the document title identifies the product as Parrot for language shadowing
