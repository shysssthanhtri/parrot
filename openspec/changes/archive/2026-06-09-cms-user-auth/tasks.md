## 1. Database

- [x] 1.1 Add `isCmsUser Boolean @default(false) @map("is_cms_user")` to `User` in `prisma/schema.prisma`
- [x] 1.2 Create and apply Prisma migration for `is_cms_user`

## 2. Auth and session

- [x] 2.1 Extend `src/types/next-auth.d.ts` with `user.isCmsUser: boolean`
- [x] 2.2 Set `session.user.isCmsUser = user.isCmsUser` in the `session` callback in `src/auth.ts`
- [x] 2.3 Update `authorized` callback: unauthenticated `/cms/*` → sign-in; authenticated non-CMS → `/forbidden`; CMS user → allow
- [x] 2.4 Add `ROUTES.PUBLIC.FORBIDDEN = "/forbidden"` in `src/app/configs/routes.ts`

## 3. Forbidden page

- [x] 3.1 Add public page at `src/app/forbidden/page.tsx` with CMS access denied messaging and link to `/`

## 4. tRPC authorization

- [x] 4.1 Add `cmsProcedure` in `src/trpc/init.ts` extending `authProcedure` (require `isCmsUser`, throw `FORBIDDEN`)
- [x] 4.2 Switch `voices`, `scripts`, `scriptGenerations`, and `speeches` routers from `authProcedure` to `cmsProcedure`

## 5. API route guard

- [x] 5.1 Require `session.user.isCmsUser` in `src/app/api/storage/upload/route.ts` (return 403 when false)

## 6. Verification

- [ ] 6.4 Run `pnpm typecheck` and fix any type errors
