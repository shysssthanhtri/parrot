## MODIFIED Requirements

### Requirement: Public signup page

The app SHALL provide a public signup page at `/signup` outside the CMS layout. Unauthenticated users SHALL be able to view the signup form. Authenticated users who visit `/signup` SHALL be redirected to the learner space at `/learn`. The page layout SHALL use the shadcn `signup-03` block pattern: full-viewport muted background, centered Parrot brand header, and a centered card form consistent with the `/signin` page.

#### Scenario: Signup page reachable

- **WHEN** an unauthenticated user navigates to `/signup`
- **THEN** the signup form is displayed without redirecting to sign-in

#### Scenario: Signup route constant

- **WHEN** application code references the public signup route
- **THEN** `ROUTES.PUBLIC.SIGNUP` resolves to `/signup`

#### Scenario: Signup matches sign-in visual shell

- **WHEN** an unauthenticated user views `/signup` and `/signin`
- **THEN** both pages share the same muted background and brand header pattern

#### Scenario: Authenticated user redirected from signup

- **WHEN** an authenticated user navigates to `/signup`
- **THEN** the app redirects to `/learn` without rendering the signup form

### Requirement: Navigation between signup and sign-in

The signup page SHALL link to the public sign-in route (`ROUTES.PUBLIC.SIGNIN`) with a callback URL of `/learn`. The sign-in page SHALL link to `/signup`. The public landing page at `/` SHALL offer entry points to both sign-in and sign-up.

#### Scenario: Link to sign-in from signup

- **WHEN** the user activates the sign-in link on `/signup`
- **THEN** the app navigates to `/signin` with a return path to `/learn`

#### Scenario: Link to signup from sign-in

- **WHEN** the user activates the sign-up link on `/signin`
- **THEN** the app navigates to `/signup`

#### Scenario: Home page auth entry points

- **WHEN** an unauthenticated user visits `/`
- **THEN** the landing page displays controls to navigate to both sign-in and sign-up
