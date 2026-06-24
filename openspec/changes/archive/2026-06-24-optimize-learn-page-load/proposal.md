## Why

`GET /learn` consistently takes **3–5 seconds** in development, with Next.js overhead under 15 ms and nearly all time attributed to **application-code** (e.g. `application-code: 4.2s`). Before changing behavior or APIs, we need structured timing to pinpoint where that time is spent. Optimization will follow in a separate change once the bottleneck is confirmed.

## What Changes

- Add **dev-only server timing instrumentation** for the `/learn` request path: layout auth, tRPC `speechPublications.list`, database query, and per-thumbnail storage resolution.
- Log a **single structured breakdown** per request to the dev console so bottlenecks are visible without guessing.
- **No behavior changes** to `speechPublications.list`, storage, or page rendering in this change.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `learner-space`: Add a dev-only requirement for structured server timing visibility on `/learn` requests.

## Impact

- **Pages**: `src/app/(client)/learn/page.tsx`, `src/app/(client)/learn/layout.tsx` — instrumentation hooks around auth and data fetch.
- **API**: `src/trpc/routers/speech-publications.ts` — read-only timing segments inside existing `list` handler (no logic changes).
- **Observability**: New dev-only timing utility in `src/lib/server-timing.ts`; complements existing Next.js `application-code` metric.
- **Dependencies**: None new.
