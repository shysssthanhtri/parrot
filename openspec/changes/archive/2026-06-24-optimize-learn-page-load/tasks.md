## 1. Server timing instrumentation

- [x] 1.1 Add `src/lib/server-timing.ts` with a dev-only `createServerTimer` helper that records segment durations and logs one structured line
- [x] 1.2 Instrument `src/app/(client)/learn/layout.tsx` with a `learn.layout.auth` segment around `auth()`
- [x] 1.3 Instrument `src/app/(client)/learn/page.tsx` with a `learn.page.list` segment around the tRPC `speechPublications.list` call
- [x] 1.4 Instrument `src/trpc/routers/speech-publications.ts` `list` handler with `list.db`, `list.thumbnails`, `list.thumbnail.exists`, and `list.thumbnail.presign` segments (include publication count in log output)

## 2. Quality gates

- [x] 2.1 Run `pnpm lint` and fix any issues in changed files
- [x] 2.2 Run `pnpm typecheck` and fix any type errors
- [x] 2.3 Run `pnpm build` and confirm the project builds successfully
