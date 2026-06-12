# cms-user-auth Specification

## Purpose

TBD - created by archiving change cms-user-auth. Update Purpose after archive.

## Requirements

### Requirement: CMS user flag on User

The system SHALL store CMS authorization on the shared `User` record as a boolean `is_cms_user` column (Prisma field `isCmsUser`, default `false`). New users created via Google sign-in or credentials provisioning SHALL default to non-CMS (`is_cms_user = false`) unless explicitly set during provisioning.

#### Scenario: New Google sign-up defaults to non-CMS

- **WHEN** a user signs in with Google for the first time and a `User` row is created
- **THEN** `is_cms_user` is `false` for that user

#### Scenario: Manual CMS grant

- **WHEN** an operator sets `is_cms_user = true` for a user in the database
- **THEN** that user is treated as a CMS user on subsequent server-side session resolution

#### Scenario: Provisioned credentials CMS user

- **WHEN** an operator creates a credentials user with `is_cms_user = true` via seed or SQL
- **THEN** that user is treated as a CMS user on subsequent server-side session resolution

### Requirement: Session exposes CMS authorization

The NextAuth session SHALL include `user.isCmsUser` populated from the database `User` record during session resolution. With JWT session strategy (required for Credentials provider), the `session` callback SHALL load the current `is_cms_user` value from the database by user ID on each server-side `auth()` invocation.

#### Scenario: CMS user session

- **WHEN** `auth()` is called for a signed-in user with `is_cms_user = true`
- **THEN** the returned session includes `user.isCmsUser === true`

#### Scenario: Non-CMS user session

- **WHEN** `auth()` is called for a signed-in user with `is_cms_user = false`
- **THEN** the returned session includes `user.isCmsUser === false`

#### Scenario: CMS flag change reflected on next auth call

- **WHEN** an operator sets `is_cms_user = true` for a signed-in user and `auth()` is invoked again on the server
- **THEN** the returned session includes the updated `user.isCmsUser` value

### Requirement: CMS route proxy gate

Routes under `/cms/*` SHALL be protected by the NextAuth `authorized` callback (via `src/proxy.ts`). Unauthenticated requests SHALL redirect to the public sign-in route. Authenticated users without CMS authorization SHALL redirect to `/forbidden`. Authenticated CMS users SHALL be allowed.

#### Scenario: Anonymous CMS access denied

- **WHEN** an unauthenticated user requests `/cms/dashboard`
- **THEN** the user is redirected to the sign-in page

#### Scenario: Non-CMS user redirected to forbidden

- **WHEN** a signed-in user with `isCmsUser === false` requests `/cms/scripts`
- **THEN** the user is redirected to `/forbidden`

#### Scenario: CMS user allowed

- **WHEN** a signed-in user with `isCmsUser === true` requests `/cms/voices`
- **THEN** the request proceeds to the CMS route

### Requirement: Forbidden page for non-CMS users

The app SHALL provide a public page at `/forbidden` outside the CMS layout. The page SHALL explain that the signed-in account does not have CMS access and SHALL offer navigation back to the public home page (`/`). The page SHALL NOT require CMS authorization to view.

#### Scenario: Forbidden page reachable

- **WHEN** a signed-in non-CMS user navigates to `/forbidden`
- **THEN** the forbidden messaging is displayed without redirecting to sign-in

#### Scenario: Link back to public site

- **WHEN** the user activates the home navigation control on `/forbidden`
- **THEN** the app navigates to `/`

### Requirement: CMS tRPC procedure

The tRPC layer SHALL define `cmsProcedure` that requires an authenticated session and `session.user.isCmsUser === true`. CMS data routers (`voices`, `scripts`, `scriptGenerations`, `speeches`) SHALL use `cmsProcedure` instead of `authProcedure`. Non-CMS authenticated callers SHALL receive a `FORBIDDEN` error.

#### Scenario: CMS tRPC allowed

- **WHEN** an authenticated CMS user calls a CMS router procedure (e.g. `scripts.list`)
- **THEN** the procedure executes successfully (subject to existing business rules)

#### Scenario: Non-CMS tRPC forbidden

- **WHEN** an authenticated non-CMS user calls `scripts.list`
- **THEN** the procedure responds with `FORBIDDEN` and does not return CMS data

#### Scenario: Unauthenticated tRPC rejected

- **WHEN** an unauthenticated client calls a CMS router procedure
- **THEN** the procedure responds with `UNAUTHORIZED`

### Requirement: CMS-only local storage upload

The authenticated local storage upload route (`PUT /api/storage/upload`) SHALL require `session.user.isCmsUser === true` in addition to an authenticated session. Non-CMS authenticated users SHALL receive HTTP 403.

#### Scenario: CMS upload allowed

- **WHEN** an authenticated CMS user uploads a valid speech WAV to the local upload route
- **THEN** the upload succeeds per existing validation rules

#### Scenario: Non-CMS upload forbidden

- **WHEN** an authenticated non-CMS user calls the local upload route
- **THEN** the response status is 403
