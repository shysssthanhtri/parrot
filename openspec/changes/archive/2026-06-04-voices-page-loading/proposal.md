## Why

The CMS Voices list page is a server component that fetches all voices via tRPC before rendering. During navigation (sidebar link, direct URL, or client transition), users currently see no feedback until the fetch completes, which feels unresponsive especially on slower networks.

## What Changes

- Add a Next.js App Router `loading.tsx` for `/cms/voices` that displays immediately while the page server component loads
- Skeleton UI that mirrors the list page layout (page title area + table with four columns matching the voices table)
- Reuse existing shadcn `Skeleton` and table components for visual consistency with the rest of the CMS

No API, data model, or tRPC changes. Voice detail page loading is out of scope for this change.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `cms-voices`: Add requirement for a loading UI on the voices list route during data fetch

## Impact

- **Code**: `src/app/(cms)/cms/voices/loading.tsx` (new), optionally a small `_components/voices-list-skeleton.tsx` if extracted for clarity
- **Dependencies**: None (uses existing `@/components/ui/skeleton` and table primitives)
- **Systems**: CMS sidebar link to `/cms/voices` unchanged; UX improves on navigation only
