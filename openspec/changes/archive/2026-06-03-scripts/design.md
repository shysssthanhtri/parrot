## Context

Parrot uses Next.js App Router with a CMS at `/cms/*` (NextAuth-protected), Prisma on PostgreSQL, and tRPC for data fetching. The `voices` capability is shipped: read-only list/detail at `/cms/voices`, `voicesRouter` with `authProcedure`, RSC pages using `createCallerFactory`. Sidebar and `ROUTES.CMS.SCRIPTS` already point to `/cms/scripts`, but there is no `Script` model, router, or pages yet.

Scripts are the text half of the shadowing pipeline; speeches (voice + script → audio) remain future work.

## Goals / Non-Goals

**Goals:**

- Store scripts in Postgres (`title`, `content`, optional `userId`)
- tRPC `scripts.list`, `getById`, `create`, `update` for CMS
- CMS list with table + **New script** → `/cms/scripts/new`
- Shared form on `/new` (create → redirect to detail) and `/[scriptId]` (update → stay + toast)
- Route helpers `SCRIPT_NEW` and `SCRIPT_DETAIL(id)`

**Non-Goals:**

- Delete API or UI
- Speeches, TTS, import/upload, AI generation
- Script segmentation (sentences/paragraphs), tags, difficulty, publish status
- Displaying creator/`createdBy` in CMS
- Linking scripts to voices in the schema

## Decisions

### Prisma `Script` model

Add `Script` with `id` (cuid), `title` (String), `content` (String `@db.Text` or unbounded String), optional `userId` → `User`, timestamps. Add `scripts Script[]` on `User` for symmetry with `Voice`.

**Alternative:** JSON segments for shadowing lines — deferred until learner UX needs structure.

### tRPC router

New `src/trpc/routers/scripts.ts` mounted on `appRouter`, mirroring `voices.ts`:

- `list`: `findMany({ orderBy: { updatedAt: 'desc' } })`
- `getById`: `findUnique` + `NOT_FOUND`
- `create` / `update`: Zod input with trimmed non-empty `title` and `content`; set `userId` from session on create when available (optional field, not shown in UI)

Use existing `authProcedure` (CMS routes already gated).

**Alternative:** Server Actions only — rejected to stay consistent with voices and enable client mutations from the form.

### CMS routes and static `new` segment

```
/cms/scripts              → list
/cms/scripts/new          → create (static route before [scriptId])
/cms/scripts/[scriptId]   → edit form
```

Place `new/page.tsx` as a sibling of `[scriptId]/` so `/cms/scripts/new` does not match the dynamic segment.

**Alternative:** Modal on list — rejected per product preference for a full page matching detail.

### Shared `ScriptForm` client component

Single form in `_components/script-form.tsx`:

- Props: `mode: 'create' | 'edit'`, optional `defaultValues`, optional `scriptId`
- Fields: `title` (Input), `content` (Textarea)
- Submit: tRPC client `scripts.create` or `scripts.update` via existing React Query / tRPC client setup
- Create success: `router.push(ROUTES.CMS.SCRIPT_DETAIL(id))`
- Edit success: `toast.success` from `sonner` (Toaster already in root layout); stay on page

List page remains a server component fetching `scripts.list` via caller (same as voices). Create/detail pages can be server wrappers that pass data into the client form.

**Alternative:** Single page for create+edit with optional `scriptId` param — rejected; explicit `/new` is clearer.

### List page UX

Mirror `VoicesTable`: shadcn `Table`, `cursor-pointer` rows → `SCRIPT_DETAIL(id)`, content snippet (~80 chars), `updatedAt` formatted. Header row with `Link` button to `SCRIPT_NEW`. Empty state: message + link to new.

### Not found

`[scriptId]/not-found.tsx` (or inline check) when `getById` fails — same pattern as voices.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Large script bodies | Use `@db.Text`; optional max length in Zod (e.g. 50k chars) |
| `new` vs dynamic route conflict | Static `new/page.tsx` at correct path depth |
| No delete | Acceptable for v1; add before speeches reference scripts if needed |
| Duplicate titles | No uniqueness constraint; titles are display labels only |

## Migration Plan

1. Add `Script` to `schema.prisma` and run `make migrate-dev NAME=add_script` (or project convention)
2. Ship tRPC router and CMS pages (no data seed required)
3. No breaking changes

## Open Questions

- Optional `userId` on create: wire from session if `authProcedure` exposes user id, else leave null for v1
