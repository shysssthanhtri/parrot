## ADDED Requirements

### Requirement: Learner space route

The app SHALL provide an authenticated learner space at `/learn` outside the CMS layout. Unauthenticated requests SHALL redirect to the public sign-in route with a callback URL of `/learn`.

#### Scenario: Learner space requires authentication

- **WHEN** an unauthenticated user navigates to `/learn`
- **THEN** the user is redirected to sign-in with a return path to `/learn`

#### Scenario: Authenticated user accesses learner space

- **WHEN** an authenticated user (CMS or non-CMS) navigates to `/learn`
- **THEN** the learner space page is displayed

#### Scenario: Learner space route constant

- **WHEN** application code references the learner home route
- **THEN** `ROUTES.LEARN.HOME` resolves to `/learn`

### Requirement: Learner space layout

The learner space SHALL use a dedicated public layout with a site header showing the Parrot brand and a sign-out control for authenticated users. The layout SHALL NOT include the CMS sidebar.

#### Scenario: Learner header with sign-out

- **WHEN** an authenticated user views `/learn`
- **THEN** a header with brand identity and sign-out is displayed without CMS navigation

#### Scenario: Sign-out returns to landing

- **WHEN** a user signs out from the learner space
- **THEN** the user is redirected to the public landing page or sign-in page

### Requirement: Learner space v1 welcome state

The learner space v1 page SHALL display a welcome message orienting the user to shadowing practice. A speech catalog and player SHALL NOT be required in v1; an empty or coming-soon state for browsing published speeches is acceptable.

#### Scenario: Welcome content displayed

- **WHEN** an authenticated user loads `/learn`
- **THEN** a welcome heading and brief orientation copy about shadowing practice are displayed

#### Scenario: Catalog not required in v1

- **WHEN** an authenticated user loads `/learn` before a catalog change ships
- **THEN** the page renders successfully without listing published speeches

### Requirement: Post-auth default destination

Successful sign-in and sign-up flows for end users SHALL redirect to `/learn` as the default authenticated destination for non-CMS product entry.

#### Scenario: Post-auth callback constant

- **WHEN** application code references the default post-auth redirect for learners
- **THEN** `ROUTES.LEARN.HOME` (or a dedicated `ROUTES.PUBLIC.POST_AUTH` alias) resolves to `/learn`
