## 1. Routes & Config

- [x] 1.1 Add `ROUTES.PUBLIC.SIGNUP: "/signup"` to `src/app/configs/routes.ts`

## 2. Registration Server Action

- [x] 2.1 Create `src/app/signup/actions.ts` with Zod schema (email, password min 8, confirmPassword match)
- [x] 2.2 Implement signup action: check duplicate email, `prisma.user.create` with `bcrypt.hash` (cost 12), `isCmsUser: false`
- [x] 2.3 On success, call `signIn("credentials", { email, password, redirectTo: "/" })` from `@/auth`
- [x] 2.4 Return structured errors for validation failures, duplicate email, and unknown errors

## 3. Signup Page UI

- [x] 3.1 Create `src/app/signup/page.tsx` with centered card layout matching public page patterns
- [x] 3.2 Create signup form client component with email, password, confirm password fields and submit handling
- [x] 3.3 Add Google OAuth button client component calling `signIn("google", { callbackUrl: "/" })`
- [x] 3.4 Add "Already have an account? Sign in" link to `ROUTES.PUBLIC.SIGNIN`
- [x] 3.5 Display field-level and form-level error messages from server action results

## 4. Public Entry Points

- [x] 4.1 Update `src/app/page.tsx` to show both Sign in and Sign up links/buttons

## 5. Verification

- [x] 5.1 Smoke test: credentials signup creates user, signs in, redirects to `/`
- [x] 5.2 Smoke test: duplicate email, password mismatch, and short password show errors
- [x] 5.3 Smoke test: new signup user has `isCmsUser === false` and `/cms/*` redirects to `/forbidden`
- [x] 5.4 Smoke test: Google signup from `/signup` works for new users
