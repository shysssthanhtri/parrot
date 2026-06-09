## Why

Parrot is adding a public-facing site that shares the same User table and Google sign-in as the CMS. Today any signed-in Google user can access `/cms/*` and all CMS tRPC routes. We need an explicit CMS authorization layer so public users can sign in without gaining CMS access, while CMS staff are granted access via a database flag.

## What Changes

- Add `is_cms_user` column on `User` (default `false`); CMS access granted by manual DB update for now
- Enrich NextAuth session with `isCmsUser` from the database user on each session resolution (database session strategy)
- Extend `authorized` in `src/auth.ts` to redirect signed-in non-CMS users from `/cms/*` to a new `/forbidden` page
- Add `cmsProcedure` in tRPC (extends `authProcedure`) requiring `isCmsUser === true`; migrate CMS routers from `authProcedure` to `cmsProcedure`
- Apply the same CMS user check to the local storage upload API route
- Add a public `/forbidden` page for users who are signed in but not CMS-authorized

## Capabilities

### New Capabilities

- `cms-user-auth`: CMS authorization model — `is_cms_user` user flag, session enrichment, route proxy gate, forbidden page, `cmsProcedure`, and CMS-only API guards

### Modified Capabilities

- `cms-voices`: Page access scenarios require an authenticated CMS user, not any signed-in user
- `cms-scripts`: Page access scenarios require an authenticated CMS user, not any signed-in user
- `cms-speeches`: Page access scenarios require an authenticated CMS user, not any signed-in user
- `cms-settings`: Settings page scenarios require an authenticated CMS user, not any signed-in user
- `cms-sidebar`: Sidebar visibility scenarios require an authenticated CMS user, not any signed-in user

## Impact

- **Database**: Prisma migration adding `is_cms_user` to `User`; existing users default to non-CMS
- **Auth**: `src/auth.ts`, `src/types/next-auth.d.ts`, `src/proxy.ts` (via `authorized` callback)
- **tRPC**: `src/trpc/init.ts` (`cmsProcedure`), CMS routers (`voices`, `scripts`, `scriptGenerations`, `speeches`)
- **API**: `src/app/api/storage/upload/route.ts`
- **UI**: New `/forbidden` page; `ROUTES` config update
- **Operations**: CMS users must be provisioned manually (`UPDATE "User" SET is_cms_user = true WHERE email = ...`)
