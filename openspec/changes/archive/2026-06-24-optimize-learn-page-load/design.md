## Context

The `/learn` route is a React Server Component page that:

1. Runs `auth()` in `layout.tsx` (redirect if unauthenticated).
2. Calls `speechPublications.list({})` via a server-side tRPC caller in `page.tsx`.
3. Renders `SpeechCarousel` with the full published catalog.

Dev terminal output shows the bottleneck is **not** Next.js routing:

```
GET /learn 200 in 4.2s (next.js: 5ms, application-code: 4.2s)
```

Suspected hot paths (to be confirmed by instrumentation, not fixed in this change):

- `auth()` in layout and/or `authProcedure`
- Prisma `findMany` in `speechPublications.list`
- Per-publication storage work in `list` (`objectExists` + `getAudioUrl` for each thumbnail)

## Goals / Non-Goals

**Goals:**

- Make `/learn` server render time measurable in dev with a clear per-phase breakdown aligned to the Next.js `application-code` metric.
- Log enough context (segment durations, publication count) to identify the dominant bottleneck.

**Non-Goals:**

- Any optimization of `speechPublications.list`, storage, or auth (follow-up change after review).
- Client-side image loading or carousel changes.
- Production APM / Datadog integration.
- `Server-Timing` HTTP headers (can add later if console logs are insufficient).

## Decisions

### 1. Dev-only timing helper in `src/lib/server-timing.ts`

**Decision:** Add a small `createServerTimer(label)` utility that records `performance.now()` segments and logs one structured line in development (`NODE_ENV === 'development'`).

**Instrumentation points:**

| Segment                  | Location                 | What it measures                                    |
| ------------------------ | ------------------------ | --------------------------------------------------- |
| `learn.layout.auth`      | `learn/layout.tsx`       | Auth.js session lookup                              |
| `learn.page.list`        | `learn/page.tsx`         | Full tRPC `speechPublications.list` call            |
| `list.db`                | `speech-publications.ts` | Prisma `findMany`                                   |
| `list.thumbnails`        | `speech-publications.ts` | Thumbnail URL resolution block                      |
| `list.thumbnail.exists`  | inside thumbnails loop   | Per-batch or aggregate time in `objectExists` calls |
| `list.thumbnail.presign` | inside thumbnails loop   | Per-batch or aggregate time in `getAudioUrl` calls  |

Log format (example):

```
[learn-timing] GET /learn total=4120ms auth=45ms list=4050ms (db=12ms thumbnails=4030ms exists=2010ms presign=2000ms count=10)
```

**Alternatives considered:**

- **Server-Timing HTTP header** — deferred; console is enough for dev terminal workflow.
- **Sentry spans** — overkill for local diagnosis.

### 2. Instrument only — no behavioral changes

**Decision:** Wrap existing code paths with timers; do not refactor list logic, storage calls, or auth in this change.

**Rationale:** User wants to measure first, optimize second.

## Risks / Trade-offs

- **[Timing overhead]** → `performance.now()` calls are negligible; no concern.
- **[Timing noise in dev]** → Cold R2 connections inflate first request; compare warm reloads. Mitigation: log speech count alongside timings.
- **[Over-logging in dev]** → Guard all timing behind `process.env.NODE_ENV === 'development'`.

## Migration Plan

1. Land timing helper + instrumentation (no behavior change).
2. Review dev console output alongside Next.js `application-code` metric.
3. Open a follow-up change for optimization based on measured bottleneck.
4. Rollback: revert instrumentation files only.

## Open Questions

- Which segment dominates — resolved after first instrumented load.
- Whether `auth()` runs twice (layout + `authProcedure`) — resolved by `learn.layout.auth` vs total `list` auth cost.
