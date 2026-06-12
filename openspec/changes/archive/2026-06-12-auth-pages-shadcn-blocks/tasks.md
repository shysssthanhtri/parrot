## 1. Shadcn blocks and shared auth shell

- [x] 1.1 Add `@shadcn/login-03` and `@shadcn/signup-03` via shadcn CLI without `--overwrite`
- [x] 1.2 Relocate generated block files into `src/app/signin/` and `src/app/signup/`; remove any unused CLI default paths (e.g. `/login`)
- [x] 1.3 Create shared auth shell component (brand link to `/`, muted layout wrapper) used by both pages

## 2. Sign-in page

- [x] 2.1 Add `src/app/signin/actions.ts` with credentials server action calling `signIn("credentials", …)` and Zod validation
- [x] 2.2 Implement `login-03`-based sign-in form with Google button, email/password fields, sign-up link, and `useActionState` error display
- [x] 2.3 Add `src/app/signin/page.tsx` composing auth shell + sign-in form; honor `callbackUrl` query param (default `/learn`)

## 3. Signup page refactor

- [x] 3.1 Refactor `src/app/signup/page.tsx` and form components to `signup-03` layout via shared auth shell
- [x] 3.2 Wire signup form to existing `signup` server action; keep email/password/confirm fields (omit full-name field)
- [x] 3.3 Add Google OAuth button and separator above credentials on signup to match sign-in; link to `signInUrl()`

## 4. Routes and Auth.js configuration

- [x] 4.1 Update `ROUTES.PUBLIC.SIGNIN` to `/signin` in `src/app/configs/routes.ts`
- [x] 4.2 Configure `pages: { signIn: "/signin" }` in `src/auth.ts`
- [x] 4.3 Update learn layout, CMS redirects, landing CTAs, and sign-out callback URLs to use `/signin`
- [x] 4.4 Redirect authenticated users from `/signin` and `/signup` to `ROUTES.LEARN.HOME` via server-side `auth()` check (shared auth layout or per-page guard)

## 5. Cleanup

- [x] 5.1 Remove superseded signup components (`signup-form.tsx` card layout, etc.) after new UI is wired
- [x] 5.2 Extract or consolidate shared Google auth button component used by sign-in and sign-up
