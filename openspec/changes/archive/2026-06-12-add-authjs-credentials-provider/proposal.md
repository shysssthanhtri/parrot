## Why

Parrot currently supports only Google OAuth for sign-in. CMS operators need a way to authenticate without a Google account—especially in environments where Google OAuth is unavailable or undesirable. Adding an Auth.js Credentials provider enables email-and-password sign-in alongside the existing Google provider while reusing the same `User` table and CMS authorization model.

## What Changes

- Add a nullable `password_hash` column on `User` for credentials-based accounts (Google-only users remain without a password)
- Register Auth.js `Credentials` provider in `src/auth.ts` with email/password validation against stored bcrypt hashes
- Switch session strategy from database-only to JWT (required by Auth.js for Credentials provider), preserving fresh `isCmsUser` resolution via session callback DB lookup
- Rely on Auth.js built-in sign-in page at `/api/auth/signin` for Google OAuth and credentials (email/password) — no custom sign-in form
- Extend user provisioning (seed script and/or documented SQL) to create CMS users with hashed passwords
- Add `bcryptjs` dependency for password hashing and verification

## Capabilities

### New Capabilities

- `credentials-auth`: Email-and-password authentication via Auth.js Credentials provider—password storage, authorize flow, sign-in UI, and CMS user provisioning with credentials

### Modified Capabilities

- `cms-user-auth`: Session resolution moves from pure database session strategy to JWT with DB-backed `isCmsUser` lookup; sign-in scenarios extend beyond Google OAuth to include credentials sign-in with the same CMS defaults

## Impact

- **Database**: Prisma migration adding nullable `password_hash` to `User`
- **Auth**: `src/auth.ts` (Credentials provider, JWT session strategy, updated callbacks), `src/types/next-auth.d.ts`
- **UI**: Auth.js built-in sign-in page at `/api/auth/signin`; simplify public home page to link there
- **Dependencies**: Add `bcryptjs` (+ `@types/bcryptjs` dev)
- **Seed/ops**: Extend `prisma/seed.ts` or document SQL for creating credential-based CMS users
- **Existing OAuth users**: Unaffected; Google sign-in continues to work with the same CMS gating
