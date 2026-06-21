## 1. Database & Dependencies

- [x] 1.1 Add nullable `passwordHash` field (`password_hash` column) to `User` in `prisma/schema.prisma`
- [x] 1.2 Create and apply Prisma migration for `password_hash`
- [x] 1.3 Add `bcryptjs` and `@types/bcryptjs` dependencies

## 2. Auth Configuration

- [x] 2.1 Switch Auth.js to JWT session strategy (`session: { strategy: "jwt" }`)
- [x] 2.2 Add `Credentials` provider with Zod-validated email/password and bcrypt verification in `authorize`
- [x] 2.3 Update `jwt` callback to persist `user.id` on sign-in
- [x] 2.4 Update `session` callback to load `isCmsUser` (and `id`) from Prisma by user ID on each call
- [x] 2.5 Verify Google OAuth provider and `PrismaAdapter` still work with JWT strategy

## 3. Sign-in UI

- [x] 3.1 Verify Auth.js built-in `/api/auth/signin` renders Google and credentials (email/password) providers
- [x] 3.2 Simplify public home page to link to `/api/auth/signin` instead of a custom Google-only form
- [x] 3.3 Verify invalid credentials redirect back to `/api/auth/signin` with a generic Auth.js error

## 4. User Provisioning

- [ ] 4.1 Extend `prisma/seed.ts` to upsert a CMS user when `SEED_CMS_EMAIL` and `SEED_CMS_PASSWORD` env vars are set
- [ ] 4.2 Hash password with bcrypt (cost 12) before storing in `password_hash`
