## Context

Parrot uses Next.js App Router with Auth.js (NextAuth v5 beta), Google OAuth, and `PrismaAdapter` with **database session strategy**. CMS routes are gated by `isCmsUser` on the session, resolved from the database on each `auth()` call. The public home page (`/`) offers Google sign-in only.

Auth.js requires **JWT session strategy** when using the Credentials provider—it cannot be used with database-only sessions. Adding email/password sign-in therefore requires a session strategy change while preserving fresh `isCmsUser` resolution for CMS authorization.

## Goals / Non-Goals

**Goals:**

- Add Auth.js `Credentials` provider for email/password sign-in
- Store bcrypt password hashes on `User` (`passwordHash`, nullable)
- Keep Google OAuth working unchanged for existing users
- Preserve server-side freshness of `isCmsUser` after switching to JWT sessions
- Provide sign-in UI with both Google and credentials options
- Support CMS user provisioning via seed script with hashed password

**Non-Goals:**

- Self-service user registration or sign-up page
- Password reset, email verification, or account linking (Google + credentials on same email)
- Multi-factor authentication
- Rate limiting or account lockout (follow-up hardening)
- Migrating existing Google users to also have passwords

## Decisions

### 1. JWT session strategy with DB-backed session callback

**Choice:** Set `session: { strategy: "jwt" }`. In `jwt` callback, persist `user.id` on initial sign-in. In `session` callback, query `prisma.user.findUnique` by ID and set `session.user.isCmsUser` from the database row.

**Rationale:** Auth.js mandates JWT for Credentials provider. A DB lookup in `session` callback preserves the same freshness guarantee as the previous database session strategy—CMS flag changes take effect on the next server-side `auth()` call.

**Alternatives considered:**

- Stay on database sessions — incompatible with Credentials provider.
- Embed `isCmsUser` in JWT only — stale until token refresh; worse than current behavior.
- Hybrid sessions (JWT for credentials, DB for OAuth) — unsupported complexity.

### 2. Nullable `password_hash` on shared `User` table

**Choice:** Add `passwordHash String? @map("password_hash")` on `User`. Google-created users have `null`; provisioned credential users have a bcrypt hash.

**Rationale:** Same user table, minimal schema change. Google-only users cannot accidentally authenticate via credentials (no hash to verify).

**Alternatives considered:**

- Separate `Credential` table — unnecessary for v1 with manual provisioning.
- Store password on `Account` — Credentials provider doesn't use OAuth account rows.

### 3. bcrypt via `bcryptjs`

**Choice:** Use `bcryptjs` with cost factor 12 for hash generation (seed/provisioning) and comparison (authorize).

**Rationale:** Pure JS, no native bindings, well-established. Cost 12 balances security and sign-in latency for a low-traffic CMS.

**Alternatives considered:**

- `bcrypt` (native) — faster but adds native compile dependency.
- Argon2 — stronger but new dependency and no existing project convention.

### 4. Credentials authorize flow

**Choice:** In `Credentials({ authorize })`:

1. Validate input with Zod (`email`, `password` non-empty)
2. `prisma.user.findUnique({ where: { email } })`
3. Return `null` if user missing or `passwordHash` is null
4. `bcrypt.compare(password, user.passwordHash)` — return `null` on mismatch
5. Return `{ id, email, name, isCmsUser }` on success

**Rationale:** Fail closed with generic errors (return `null`, no user enumeration). Reuse existing `User` fields for session population.

### 5. Auth.js built-in sign-in page

**Choice:** Use the Auth.js built-in sign-in page at `/api/auth/signin` (already referenced by `ROUTES.PUBLIC.SIGNIN` and CMS unauthorized redirects). With the `Credentials` provider configured with `email` and `password` fields, Auth.js renders both Google OAuth and credentials inputs automatically. Simplify `src/app/page.tsx` to link to `/api/auth/signin` instead of a custom Google-only form.

**Rationale:** CMS gating already redirects unauthenticated users to `/api/auth/signin`. No custom UI to build or maintain; Auth.js handles form submission and generic error display (`CredentialsSignin`) on failure.

**Alternatives considered:**

- Custom form on home page — redundant with built-in page; rejected after review.
- Custom `/signin` route — unnecessary when built-in page suffices.
- Client-side `signIn` from `next-auth/react` — not needed for built-in page flow.

### 6. Seed-based CMS user provisioning

**Choice:** Extend `prisma/seed.ts` to upsert a CMS user when `SEED_CMS_EMAIL` and `SEED_CMS_PASSWORD` env vars are set. Hash password with bcrypt before upsert.

**Rationale:** Matches existing manual provisioning pattern for `is_cms_user`. Optional env vars avoid breaking current seed (system voices only).

### 7. Keep PrismaAdapter for Google OAuth

**Choice:** Retain `adapter: PrismaAdapter(prisma)` alongside JWT sessions. Google sign-in continues to create `Account` rows via the adapter; Credentials sign-in bypasses the adapter (returns user from `authorize`).

**Rationale:** No change to OAuth account linking. Adapter still manages Google `Account` records.

## Risks / Trade-offs

- **[JWT migration invalidates existing DB sessions]** → Users signed in via Google must re-authenticate once after deploy. Acceptable for low user count; communicate if needed.
- **[Session callback adds DB query per auth() call]** → Same cost model as database sessions; acceptable for CMS traffic.
- **[No account linking]** → A Google user and a credentials user cannot share the same email without manual merge. Document as operator constraint.
- **[No rate limiting on credentials]** → Brute-force risk mitigated by low exposure and optional infra-level limits later.
- **[Generic error messages]** → Slightly worse UX but prevents email enumeration.

## Migration Plan

1. Add Prisma migration for `password_hash` column
2. Deploy auth changes (JWT strategy, Credentials provider, updated callbacks)
3. Run seed with `SEED_CMS_EMAIL` / `SEED_CMS_PASSWORD` to create first credentials CMS user (or manual SQL with pre-hashed password)
4. Smoke test: Google sign-in still works; credentials sign-in works for provisioned CMS user; non-CMS credentials user redirected to `/forbidden`; CMS credentials user reaches `/cms/*`

**Rollback:** Revert code to database session strategy; `password_hash` column can remain unused.

## Open Questions

None — session strategy, provisioning path, and UI location are resolved above.
