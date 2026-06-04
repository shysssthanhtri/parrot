## Context

The Voices list at `src/app/(cms)/cms/voices/page.tsx` is an async Server Component that calls `caller.voices.list()` before rendering `VoicesTable`. Next.js App Router supports route-level `loading.tsx` files that stream instantly while sibling `page.tsx` suspends. The project has no `loading.tsx` files yet; shadcn `Skeleton` is already used on the voice detail audio preview.

The list page layout is a padded column with an `h1` ("Voices") and a four-column shadcn `Table` (Name, Language, Description, Updated).

## Goals / Non-Goals

**Goals:**

- Show immediate visual feedback when navigating to `/cms/voices`
- Skeleton structure that approximates the real table (header row + several body rows)
- Match existing page spacing (`flex flex-col gap-4 p-4 md:p-6`) and typography scale for the title area

**Non-Goals:**

- Loading UI for `/cms/voices/[voiceId]` (detail page)
- Loading for Scripts or other CMS routes
- Changing data fetching (no Suspense boundary inside `page.tsx` unless needed later)
- Artificial delay or loading indicators inside `VoicesTable`

## Decisions

### 1. Use `loading.tsx` at the route segment

**Choice:** Add `src/app/(cms)/cms/voices/loading.tsx` as a default export.

**Rationale:** Next.js automatically wraps `page.tsx` in a Suspense boundary and renders `loading.tsx` as the fallback. No changes to `page.tsx` or tRPC are required.

**Alternatives considered:**

- Inline `Suspense` in `page.tsx` with a manual fallback — more boilerplate for the same effect at this route depth.
- Client-side loading state in a wrapper — fights the Server Component data-fetch pattern already in use.

### 2. Skeleton composition

**Choice:** Implement skeleton inline in `loading.tsx` using shadcn `Table` + `Skeleton`, or extract `VoicesListSkeleton` under `_components/` if the file grows past ~40 lines.

**Rationale:** Mirrors `VoicesTable` column structure (4 headers, ~5–8 skeleton rows) so the transition to real content feels stable. Reuses `@/components/ui/table` and `@/components/ui/skeleton` like the rest of the CMS.

**Alternatives considered:**

- Generic full-page spinner — weaker layout stability and inconsistent with detail page skeleton usage.
- Duplicating table markup without `Table` primitives — harder to keep column alignment consistent.

### 3. Title during loading

**Choice:** Render the real `"Voices"` `h1` in `loading.tsx` (not a skeleton bar for the title).

**Rationale:** Title is static; showing it immediately reinforces where the user landed. Only the table body is unknown.

## Risks / Trade-offs

- **[Flash of loading on fast networks]** → Acceptable; Next.js only shows loading when navigation suspends; very fast loads may skip it entirely.
- **[Skeleton row count mismatch]** → Use a fixed middle count (e.g. 6 rows); minor layout shift when real row count differs is acceptable for v1.
- **[No loading for in-page refresh]** → `loading.tsx` applies to route transitions; full document reload behavior is the same. No extra work unless product asks for it.

## Migration Plan

Deploy as a single frontend addition. No database, env, or API migration. Rollback: delete `loading.tsx` (and optional skeleton component).

## Open Questions

None for v1. If Scripts or Dashboard need the same pattern later, consider a shared CMS table skeleton component in a follow-up change.
