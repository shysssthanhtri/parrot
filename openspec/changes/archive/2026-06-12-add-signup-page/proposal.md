## Why

Parrot supports Google OAuth and credentials sign-in at `/api/auth/signin`, but new users cannot create credentials-based accounts themselves—CMS operators must provision users via seed or SQL. A public signup page enables self-service registration for the public site while preserving the existing CMS authorization model (new sign-ups default to non-CMS).

## What Changes

- Add a public signup page at `/signup` with layout and styling consistent with the Auth.js sign-in experience (centered card, email/password fields, Google OAuth option, link to sign in)
- Add a server-side registration flow that creates a `User` with bcrypt-hashed `password_hash`, rejects duplicate emails, and defaults `is_cms_user` to `false`
- After successful signup, sign the user in via Auth.js credentials and redirect to the public home page (`/`)
- Add `ROUTES.PUBLIC.SIGNUP` and cross-links between `/signup` and `/api/auth/signin`
- Update the public home page to offer both sign-in and sign-up entry points

## Capabilities

### New Capabilities

- `user-signup`: Self-service public registration page, validation, user creation with password hash, post-signup session establishment, and navigation between signup and sign-in

### Modified Capabilities

- `credentials-auth`: Extend from operator-only provisioning to include self-service signup; sign-in page SHALL link to signup

## Impact

- **UI**: New `src/app/signup/` page and shared auth form components; updates to `src/app/page.tsx` and sign-in cross-links
- **Auth**: Registration server action or route handler using `bcryptjs` and `signIn` from `@/auth`; no Auth.js provider changes required
- **Routes**: `src/app/configs/routes.ts` — add `SIGNUP`
- **Database**: No schema migration; uses existing `User.passwordHash` column
- **Specs**: New `user-signup` capability; delta on `credentials-auth`
