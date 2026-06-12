# user-signup Specification

## Purpose

TBD - created by archiving change add-signup-page. Update Purpose after archive.

## Requirements

### Requirement: Public signup page

The app SHALL provide a public signup page at `/signup` outside the CMS layout. The page SHALL NOT require authentication to view. The page layout SHALL use a centered card pattern consistent with other public pages (e.g. `/forbidden`).

#### Scenario: Signup page reachable

- **WHEN** an unauthenticated user navigates to `/signup`
- **THEN** the signup form is displayed without redirecting to sign-in

#### Scenario: Signup route constant

- **WHEN** application code references the public signup route
- **THEN** `ROUTES.PUBLIC.SIGNUP` resolves to `/signup`

### Requirement: Credentials signup form

The signup page SHALL provide a form with email, password, and confirm password fields. On submit, the system SHALL validate input, create a new `User` with bcrypt-hashed `password_hash`, and default `is_cms_user` to `false`.

#### Scenario: Successful credentials signup

- **WHEN** a user submits a valid email, matching passwords (minimum 8 characters), and the email is not already registered
- **THEN** a new `User` row is created with bcrypt `password_hash` and `is_cms_user = false`

#### Scenario: Duplicate email rejected

- **WHEN** a user submits an email that already exists in the database
- **THEN** signup fails with an error indicating the email is already registered and no new user is created

#### Scenario: Password mismatch rejected

- **WHEN** a user submits password and confirm password that do not match
- **THEN** signup fails with a validation error and no user is created

#### Scenario: Short password rejected

- **WHEN** a user submits a password shorter than 8 characters
- **THEN** signup fails with a validation error and no user is created

### Requirement: Post-signup session

After successful credentials signup, the system SHALL establish an authenticated session for the new user and redirect to the public home page (`/`).

#### Scenario: Auto sign-in after signup

- **WHEN** credentials signup succeeds
- **THEN** the user is signed in and redirected to `/`

#### Scenario: New signup user is non-CMS

- **WHEN** a user completes credentials signup and `auth()` is invoked
- **THEN** the session includes `user.isCmsUser === false`

### Requirement: Google signup option

The signup page SHALL offer Google OAuth sign-up using the existing Google provider. Google sign-up SHALL follow the same CMS defaults as Google sign-in (`is_cms_user = false` for new users).

#### Scenario: Google signup from signup page

- **WHEN** a user activates Google sign-up on `/signup`
- **THEN** Auth.js initiates the Google OAuth flow and creates or signs in the user per existing OAuth behavior

### Requirement: Navigation between signup and sign-in

The signup page SHALL link to the public sign-in route (`ROUTES.PUBLIC.SIGNIN`). The public home page SHALL offer entry points to both sign-in and sign-up.

#### Scenario: Link to sign-in from signup

- **WHEN** the user activates the sign-in link on `/signup`
- **THEN** the app navigates to `/api/auth/signin`

#### Scenario: Home page auth entry points

- **WHEN** an unauthenticated user visits `/`
- **THEN** the page displays controls to navigate to both sign-in and sign-up
