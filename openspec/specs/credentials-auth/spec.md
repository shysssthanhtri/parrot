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

The public sign-in entry point SHALL be the Auth.js built-in page at `/api/auth/signin`. That page SHALL offer both Google OAuth and email/password credentials sign-in. Auth.js SHALL render credentials inputs from the `Credentials` provider configuration and handle form submission without a custom sign-in page.

#### Scenario: Built-in sign-in page shows both providers

- **WHEN** an unauthenticated user visits `/api/auth/signin`
- **THEN** the page displays Google sign-in and email/password fields for credentials

#### Scenario: Invalid credentials show error on built-in page

- **WHEN** a user submits invalid credentials on `/api/auth/signin`
- **THEN** Auth.js redirects back with a generic authentication error without exposing whether the email exists

### Requirement: Credentials user provisioning

The system SHALL support creating credential-based CMS users outside the sign-in UI. The seed script or documented SQL SHALL hash passwords with bcrypt before storing them in `password_hash`.

#### Scenario: Seed creates credentials CMS user

- **WHEN** the seed script runs with configured CMS user email and password
- **THEN** a `User` row exists with matching email, bcrypt `password_hash`, and `is_cms_user = true`
