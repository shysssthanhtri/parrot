## ADDED Requirements

### Requirement: Self-service credentials signup

The system SHALL support self-service registration via the public signup page in addition to operator provisioning via seed or SQL. Self-service signup SHALL create users with bcrypt-hashed `password_hash` and `is_cms_user = false`.

#### Scenario: Self-service user has password hash

- **WHEN** a user completes credentials signup via `/signup`
- **THEN** the `User` row has a non-null bcrypt `password_hash` and `is_cms_user = false`

#### Scenario: Self-service signup distinct from operator provisioning

- **WHEN** an operator provisions a CMS user via seed or SQL with `is_cms_user = true`
- **THEN** that provisioning path continues to work unchanged alongside self-service signup
