## Context

Parrot uses Next.js App Router with NextAuth v5 (Google OAuth, `PrismaAdapter`, **database session strategy**). CMS routes under `/cms/*` are gated by `src/proxy.ts` exporting `auth` and an `authorized` callback in `src/auth.ts` that currently allows **any** signed-in user. CMS tRPC routers (`voices`, `scripts`, `scriptGenerations`, `speeches`) use `authProcedure`, which only checks for a session. The public home page (`/`) already offers Google sign-in using the same `User` table.

There is no CMS role or flag on `User` today. The app is moving toward a shared auth stack where public users sign in without CMS access.

## Goals / Non-Goals

**Goals:**

- Add `is_cms_user` on `User` (default `false`) with Prisma field `isCmsUser` mapped to column `is_cms_user`
- Expose `isCmsUser` on the NextAuth session via the existing database session `session` callback (no JWT strategy change)
- Gate `/cms/*` in `authorized`: unauthenticated → sign-in; authenticated non-CMS → `/forbidden`; CMS user → allow
- Add public `/forbidden` page outside the CMS layout
- Add `cmsProcedure` extending `authProcedure` (requires `isCmsUser === true`, returns `FORBIDDEN` otherwise)
- Migrate CMS tRPC routers and the local storage upload route to CMS authorization
- Document manual CMS user provisioning via SQL

**Non-Goals:**

- Admin UI or self-service for granting CMS access
- Email allowlist or automatic CMS promotion on sign-in
- Role hierarchy (editor vs admin) — boolean flag only for v1
- Separate User tables or auth providers for public vs CMS
- Switching to JWT session strategy or building refresh-token machinery
- Re-checking `is_cms_user` with an extra Prisma query in `cmsProcedure` (session resolution already loads User from DB)

## Decisions

### 1. Boolean `is_cms_user` on shared `User` table

**Choice:** Add `isCmsUser Boolean @default(false) @map("is_cms_user")` on `User`. Grant CMS access by manual SQL update.

**Rationale:** Matches explored design; minimal schema; public Google sign-ups default to non-CMS. Same user can use public features when signed in.

**Alternatives considered:**

- Separate `CmsUser` table — unnecessary duplication for v1.
- Role enum — overkill until multiple CMS permission levels are needed.

### 2. Session enrichment via database session callback (not JWT claims)

**Choice:** In `session({ session, user })`, set `session.user.isCmsUser = user.isCmsUser`. Extend `src/types/next-auth.d.ts`.

**Rationale:** With `PrismaAdapter`, NextAuth uses database sessions. Each `auth()` call resolves Session → User from DB, so `isCmsUser` is fresh on server-side checks without a separate query or JWT refresh flow. The cookie holds an opaque `sessionToken`, not self-contained claims.

**Alternatives considered:**

- JWT strategy with `isCmsUser` in token — faster cookie-only reads but stale until expiry/refresh; not worth switching.
- Extra `prisma.user.findUnique` in `cmsProcedure` — redundant given database session resolution.

### 3. Layered CMS authorization

**Choice:** Enforce CMS access at three layers:

1. **`authorized` callback** — route UX gate for `/cms/*`
2. **`cmsProcedure`** — tRPC data layer
3. **`/api/storage/upload`** — manual check (CMS-only upload route)

**Rationale:** Defense in depth. Proxy redirect prevents rendering CMS shell; tRPC/API checks block direct API calls.

```
Request → proxy (authorized) → page/RSC
                ↓
         tRPC cmsProcedure
                ↓
         storage upload route
```

### 4. Forbidden page at `/forbidden` (outside `/cms/*`)

**Choice:** Add `ROUTES.PUBLIC.FORBIDDEN = "/forbidden"` and a simple page with messaging plus link to `/`. Redirect signed-in non-CMS users here from `authorized`.

**Rationale:** `/forbidden` is outside the CMS matcher, avoiding chicken-and-egg (non-CMS users cannot load CMS layout). User stays signed in as a valid public user.

**Alternatives considered:**

- `/cms/forbidden` — would require proxy exceptions and CMS layout for denied users.

### 5. `cmsProcedure` extends `authProcedure`

**Choice:**

```typescript
export const authProcedure =
  baseProcedure.use(/* session required → ctx { userId } */);
export const cmsProcedure =
  authProcedure.use(/* session.user.isCmsUser → FORBIDDEN */);
```

**Rationale:** Clear naming for future public authenticated routes using `authProcedure` only. All current CMS routers switch to `cmsProcedure`.

### 6. `authorized` callback logic

**Choice:**

| Path         | Session | `isCmsUser` | Result                   |
| ------------ | ------- | ----------- | ------------------------ |
| not `/cms/*` | any     | any         | allow                    |
| `/cms/*`     | none    | —           | redirect to sign-in      |
| `/cms/*`     | yes     | false       | redirect to `/forbidden` |
| `/cms/*`     | yes     | true        | allow                    |

**Rationale:** Matches explored UX. Sign-in redirect unchanged for anonymous users.

## Risks / Trade-offs

- **[No admin UI for CMS grants]** → Mitigation: document SQL; acceptable for v1 per user decision.
- **[Client `useSession()` may lag DB revoke briefly]** → Server-side `auth()` / `cmsProcedure` / proxy use fresh DB user; acceptable for v1.
- **[Existing Google users lose CMS access until flagged]** → Expected after deploy; operators grant CMS access manually in the database when needed.
- **[Forbidden page discoverability]** → Clear copy explaining lack of CMS access; link home.

## Migration Plan

1. Add Prisma migration with `is_cms_user` default `false`
2. Deploy auth, tRPC, proxy, forbidden page, and upload route changes together
3. Smoke test: non-CMS signed-in user → `/forbidden`; CMS user (after manual DB grant) → `/cms/dashboard`; tRPC returns `FORBIDDEN` for non-CMS

**Rollback:** Revert code; column can remain (unused) or drop in follow-up migration.

## Open Questions

None — provisioning, forbidden page, naming, and session freshness were resolved in explore mode.
