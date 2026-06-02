## Context

Parrot uses Next.js App Router with a CMS at `/cms/*` (NextAuth-protected), Prisma on PostgreSQL, and tRPC for data fetching. A `Voice` Prisma model and migration already exist; `voicesRouter` is scaffolded but not mounted. Twenty system WAV files live at `./data/system-voices/`. Sidebar and `ROUTES.CMS.VOICES` already point to `/cms/voices`. No R2/S3 SDK or env vars exist yet.

## Goals / Non-Goals

**Goals:**

- Store voice metadata in Postgres; optional `r2ObjectKey` supports metadata-first, upload-later workflows
- Upload system voices from `./data/system-voices` via seed script
- Read-only CMS: list all voices, detail with optional audio preview
- tRPC `voices.list` and `voices.getById` for CMS pages

**Non-Goals:**

- Manual voice create/edit UI in CMS
- Displaying `createdBy` / creator in UI
- Scripts, speeches, or TTS generation
- Filtering list by `userId` (list all voices)
- Transcoding audio (store and serve WAV as seeded)

## Decisions

### R2 via AWS S3 SDK

Use `@aws-sdk/client-s3` with `endpoint: https://<accountId>.r2.cloudflarestorage.com`, `region: 'auto'`, and credentials from env. Shared module `src/lib/r2.ts` with `uploadObject` (seed) and `getPresignedGetUrl` (detail preview, ~1h TTL).

**Alternative:** Public bucket URLs — rejected for v1 to keep bucket private.

### Object key convention

`system-voices/{slug}.wav` where `slug` is lowercase filename stem (e.g. `Andy.wav` → `system-voices/andy.wav`). Stable across re-seeds; independent of DB `id`.

### Seed upsert by `name`

Derive `name` from filename (`Andy.wav` → `Andy`). Upsert with `where: { name }` requires a unique constraint on `name` **or** use `findFirst` + create/update. **Decision:** add `@@unique([name])` on `Voice` if not present, or upsert via composite logic without migration if team prefers — implementer should add `@@unique([name])` for clean idempotency (document in tasks).

**Alternative:** Fixed cuid in manifest JSON — more maintenance for 20 static files.

### tRPC and auth

Mount `voicesRouter` on `appRouter`. Replace stub `userId: "user_123"` in `createTRPCContext` with session from `auth()` for CMS procedures. Use `baseProcedure` initially (CMS route already gated); optional `protectedProcedure` if added to init.

List/detail data can use RSC + `trpc` server proxy pattern already in `src/trpc/server.tsx`.

### CMS UI

- List: `src/app/(cms)/cms/voices/page.tsx` — shadcn `Table`, client or server fetch via tRPC
- Detail: `src/app/(cms)/cms/voices/[voiceId]/page.tsx`
- Add `ROUTES.CMS.voiceDetail(id)` helper
- Row navigation: `Link` on row or `useRouter` on `TableRow` with `cursor-pointer`

### Audio preview (last task)

Detail page server component fetches voice via tRPC/prisma; if `r2ObjectKey`, compute presigned URL server-side and pass to client `<audio controls src={url} />`. Keeps secrets off client except time-limited URL.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| R2 credentials missing locally | Document env vars in README; seed/preview fail clearly |
| Large WAV presigned bandwidth | Acceptable for CMS preview; CDN later if needed |
| `name` uniqueness collisions | Seed only system folder; unique on `name` for upsert |
| tRPC context still stubbed | Fix in same change before shipping CMS |

## Migration Plan

1. Add R2 env vars to `.env.example` / README (not committed secrets)
2. `pnpm add` AWS SDK packages
3. Run seed after R2 bucket configured: `npx tsx scripts/seed-system-voices.ts` (or project script)
4. No breaking API changes (new routes/procedures only)

## Open Questions

- Whether to add `@@unique([name])` on `Voice` in this change (recommended for seed idempotency)
