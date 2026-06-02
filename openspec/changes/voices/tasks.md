## 1. R2 storage and environment

- [x] 1.1 Add `@aws-sdk/client-s3` and presigner dependency
- [x] 1.2 Extend `src/lib/env.ts` with R2 variables (account id, access key, secret, bucket name)
- [x] 1.3 Create `src/lib/r2.ts` with S3 client (R2 endpoint), `uploadObject`, and `getPresignedGetUrl`
- [x] 1.4 Document required R2 env vars in README or `.env.example`

## 2. Database and seed

- [x] 2.1 Voice schema (no unique on `name`; seed uses findFirst by name + `userId: null`)
- [x] 2.2 Implement `scripts/seed-system-voices.ts`: read `./data/system-voices/*.wav`, upload to R2, upsert by `name` with `userId: null` and `language: en-US`
- [x] 2.3 Configure Prisma seed (`prisma db seed` via `prisma.config.ts`)

## 3. tRPC voices API

- [ ] 3.1 Implement `voices.list` and `voices.getById` in `src/trpc/routers/voices.ts`
- [ ] 3.2 Mount `voicesRouter` on `src/trpc/routers/_app.ts`
- [ ] 3.3 Wire real session/user in `createTRPCContext` (replace stub)

## 4. CMS routes and list page

- [ ] 4.1 Add `voiceDetail(id)` to `src/app/configs/routes.ts`
- [ ] 4.2 Create `src/app/(cms)/cms/voices/page.tsx` with shadcn table listing all voices
- [ ] 4.3 Make table rows navigate to `/cms/voices/[voiceId]`

## 5. CMS detail page

- [ ] 5.1 Create `src/app/(cms)/cms/voices/[voiceId]/page.tsx` with read-only metadata
- [ ] 5.2 Handle missing voice (not found UI)
- [ ] 5.3 Show empty state when `r2ObjectKey` is null (no player)

## 6. Audio preview

- [ ] 6.1 Add server-side presigned URL for detail when `r2ObjectKey` is set
- [ ] 6.2 Render `<audio controls>` on detail page with presigned `src`
