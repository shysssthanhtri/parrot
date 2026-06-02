## Why

Parrot is an English shadowing app where generated speeches combine a voice with a script. We need a voices capability so the CMS can browse voice metadata and preview audio samples before scripts and speeches are built. System voices must be seedable from local assets without a manual create UI.

## What Changes

- R2 object storage integration (AWS S3 SDK against Cloudflare R2) for voice audio files
- Environment variables and server helpers for R2 upload and presigned GET URLs
- `scripts/seed-system-voices.ts` uploads WAV files from `./data/system-voices` and upserts voice rows in PostgreSQL
- tRPC `voices` router with `list` and `getById` procedures, mounted on `appRouter`
- CMS pages at `/cms/voices` (table of all voices) and `/cms/voices/[voiceId]` (read-only detail)
- Audio preview on the detail page when `r2ObjectKey` is set; graceful empty state when not
- Route helper for voice detail URLs

No manual voice creation UI. No `createdBy` display in CMS. Speeches and scripts are out of scope.

## Capabilities

### New Capabilities

- `voices`: Voice metadata in PostgreSQL (existing Prisma model), optional `r2ObjectKey`, system seeding, R2 file storage, and tRPC read APIs
- `cms-voices`: Authenticated CMS list and detail pages for voices with shadcn table and row navigation

### Modified Capabilities

<!-- none -->

## Impact

- **Dependencies**: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` (or equivalent presign approach)
- **Env**: R2 account, bucket, access key, secret (validated in `src/lib/env.ts`)
- **Code**: `src/lib/r2.ts`, `src/trpc/routers/voices.ts`, `src/trpc/routers/_app.ts`, `src/trpc/init.ts` (session context), `scripts/seed-system-voices.ts`, `src/app/(cms)/cms/voices/`, `src/app/configs/routes.ts`
- **Data**: Existing `Voice` model and migration; `r2ObjectKey` remains optional
- **Assets**: `./data/system-voices/*.wav` (20 system voices)
