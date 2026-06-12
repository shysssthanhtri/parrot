## MODIFIED Requirements

### Requirement: Sign-in via Auth.js built-in page

The public sign-in entry point SHALL be a custom page at `/signin` styled with the shadcn `login-03` block pattern (muted background, brand header, centered card). That page SHALL offer both Google OAuth and email/password credentials sign-in to unauthenticated users. Authenticated users who visit `/signin` SHALL be redirected to the learner space at `/learn`. Credentials sign-in SHALL submit through a server action that calls Auth.js `signIn("credentials", …)` with a default post-auth redirect to `/learn`. Auth.js SHALL be configured with `pages.signIn` pointing to `/signin` so CMS and framework redirects use the custom page. `ROUTES.PUBLIC.SIGNIN` SHALL resolve to `/signin`.

#### Scenario: Custom sign-in page shows both providers

- **WHEN** an unauthenticated user navigates to `/signin`
- **THEN** the page displays Google sign-in and email/password fields for credentials in the login-03 layout

#### Scenario: Sign-in route constant

- **WHEN** application code references the public sign-in route
- **THEN** `ROUTES.PUBLIC.SIGNIN` resolves to `/signin`

#### Scenario: CMS unauthorized redirect uses custom sign-in

- **WHEN** an unauthenticated user requests a CMS route
- **THEN** the user is redirected to `/signin` (not the Auth.js built-in HTML page)

#### Scenario: Invalid credentials show generic error

- **WHEN** a user submits invalid credentials on `/signin`
- **THEN** the form displays a generic authentication error without exposing whether the email exists

#### Scenario: Sign-in supports learner callback

- **WHEN** a user visits `/signin?callbackUrl=/learn` and completes sign-in successfully
- **THEN** the user is redirected to `/learn`

#### Scenario: Authenticated user redirected from sign-in

- **WHEN** an authenticated user navigates to `/signin`
- **THEN** the app redirects to `/learn` without rendering the sign-in form
