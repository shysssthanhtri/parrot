# credentials-auth Specification

## Purpose

TBD - created by archiving change add-authjs-credentials-provider. Update Purpose after archive.

## Requirements

### Requirement: Password hash storage on User

The system SHALL store a bcrypt password hash on the shared `User` record in a nullable `password_hash` column (Prisma field `passwordHash`). Users created via Google OAuth SHALL have `password_hash = null`. Users provisioned for credentials sign-in SHALL have a non-null bcrypt hash.

#### Scenario: Google-only user has no password

- **WHEN** a user signs in with Google for the first time and a `User` row is created
- **THEN** `password_hash` is `null` for that user

#### Scenario: Credentials user has password hash

- **WHEN** an operator provisions a CMS user with email and password via seed or SQL
- **THEN** the `User` row has a non-null bcrypt `password_hash` and `is_cms_user = true`

### Requirement: Credentials provider authentication

The Auth.js configuration SHALL register a `Credentials` provider that accepts `email` and `password`. On sign-in, the system SHALL look up the user by email, verify the password against `password_hash` using bcrypt, and reject sign-in when the user does not exist, has no password hash, or the password is incorrect.

#### Scenario: Valid credentials sign-in

- **WHEN** a user submits a registered email and correct password via the credentials sign-in flow
- **THEN** Auth.js creates an authenticated session for that user

#### Scenario: Unknown email rejected

- **WHEN** a user submits an email that does not exist in the database
- **THEN** sign-in fails without revealing whether the email exists

#### Scenario: Wrong password rejected

- **WHEN** a user submits a registered email with an incorrect password
- **THEN** sign-in fails

#### Scenario: Google-only user cannot use credentials

- **WHEN** a user with `password_hash = null` attempts credentials sign-in
- **THEN** sign-in fails

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

### Requirement: Credentials user provisioning

The system SHALL support creating credential-based CMS users outside the sign-in UI. The seed script or documented SQL SHALL hash passwords with bcrypt before storing them in `password_hash`.

#### Scenario: Seed creates credentials CMS user

- **WHEN** the seed script runs with configured CMS user email and password
- **THEN** a `User` row exists with matching email, bcrypt `password_hash`, and `is_cms_user = true`

### Requirement: Self-service credentials signup

The system SHALL support self-service registration via the public signup page in addition to operator provisioning via seed or SQL. Self-service signup SHALL create users with bcrypt-hashed `password_hash` and `is_cms_user = false`.

#### Scenario: Self-service user has password hash

- **WHEN** a user completes credentials signup via `/signup`
- **THEN** the `User` row has a non-null bcrypt `password_hash` and `is_cms_user = false`

#### Scenario: Self-service signup distinct from operator provisioning

- **WHEN** an operator provisions a CMS user via seed or SQL with `is_cms_user = true`
- **THEN** that provisioning path continues to work unchanged alongside self-service signup
