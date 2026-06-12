## MODIFIED Requirements

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
