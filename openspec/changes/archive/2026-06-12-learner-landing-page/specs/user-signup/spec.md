## MODIFIED Requirements

### Requirement: Post-signup session

After successful credentials signup, the system SHALL establish an authenticated session for the new user and redirect to the learner space at `/learn`.

#### Scenario: Auto sign-in after signup

- **WHEN** credentials signup succeeds
- **THEN** the user is signed in and redirected to `/learn`

#### Scenario: New signup user is non-CMS

- **WHEN** a user completes credentials signup and `auth()` is invoked
- **THEN** the session includes `user.isCmsUser === false`

### Requirement: Google signup option

The signup page SHALL offer Google OAuth sign-up using the existing Google provider. Google sign-up SHALL follow the same CMS defaults as Google sign-in (`is_cms_user = false` for new users). Google sign-up SHALL use a post-auth callback URL of `/learn`.

#### Scenario: Google signup from signup page

- **WHEN** a user activates Google sign-up on `/signup`
- **THEN** Auth.js initiates the Google OAuth flow and creates or signs in the user per existing OAuth behavior

#### Scenario: Google signup callback targets learner space

- **WHEN** a user completes Google sign-up from `/signup`
- **THEN** the user is redirected to `/learn` after authentication

### Requirement: Navigation between signup and sign-in

The signup page SHALL link to the public sign-in route (`ROUTES.PUBLIC.SIGNIN`) with a callback URL of `/learn`. The public landing page at `/` SHALL offer entry points to both sign-in and sign-up.

#### Scenario: Link to sign-in from signup

- **WHEN** the user activates the sign-in link on `/signup`
- **THEN** the app navigates to sign-in with a return path to `/learn`

#### Scenario: Home page auth entry points

- **WHEN** an unauthenticated user visits `/`
- **THEN** the landing page displays controls to navigate to both sign-in and sign-up
