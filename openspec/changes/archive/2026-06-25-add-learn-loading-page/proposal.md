## Why

The `/learn` page fetches published speeches on the server before rendering the speech carousel. During that fetch, authenticated users see a blank main area beneath the learner header, which feels broken compared to CMS routes that already stream skeleton loading UIs. A route-level loading state will give immediate visual feedback and reduce perceived wait time while `speechPublications.list` resolves.

## What Changes

- Add a Next.js `loading.tsx` for the `/learn` route segment that displays while the page server component suspends on data fetch.
- Mirror the speech carousel layout: a centered portrait card skeleton (cover image area, title, metadata) within the same width and height constraints as the loaded catalog.
- Preserve the existing learner layout header during loading (auth and `LearnHeader` continue to render from `layout.tsx`).
- Do not change catalog behavior, data fetching, or empty-state handling once the page finishes loading.

## Capabilities

### New Capabilities

_None — this extends existing learner-space behavior rather than introducing a new capability._

### Modified Capabilities

- `learner-space`: Add a requirement that `/learn` shows a skeleton loading UI matching the speech catalog card layout while server data is loading.

## Impact

- **UI:** New `src/app/(client)/learn/loading.tsx` (and optionally a small skeleton component under `_components/` if the file grows).
- **Dependencies:** Reuses existing shadcn `Skeleton` and `Card` components; no new packages.
- **APIs / data:** No tRPC, Prisma, or auth changes.
- **Routing:** No URL or redirect changes; standard App Router streaming only.
