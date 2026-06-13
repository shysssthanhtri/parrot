## Context

The CMS speeches list (`/cms/speeches`) renders `SpeechesTable` with process status via `SpeechProcessStatusBadge`. Speech publishing landed on the detail page (`speech-publishing-card.tsx`) with `PublicationSummary` types, labels, and badge variants, and `speeches.getById` already maps publication data. The list query (`speeches.list`) uses `speechListInclude` with only voice and script — no `publication` relation — so the table cannot show live/unpublished state without opening each speech.

## Goals / Non-Goals

**Goals:**

- Show publication status (`Not published`, `Published`, `Unpublished`) in the speeches list table
- Return publication summary from `speeches.list` using the same shape as `speeches.getById`
- Keep badge styling consistent with the detail page
- Rename the process status column header to **Process** to avoid ambiguity with publication

**Non-Goals:**

- Inline publish/unpublish actions on the list page (remain on detail page only)
- Filtering or sorting by publication status
- Learner catalog changes
- Schema or migration changes

## Decisions

### 1. Extend `speeches.list` with publication include and mapping

Add `publication: { select: { status: true, publishedAt: true } }` to `speechListInclude` and map each row the same way as `getById`:

```ts
publication: speech.publication
  ? {
      status: speech.publication.status,
      publishedAt: speech.publication.publishedAt,
    }
  : { status: "not_published" as const };
```

**Alternative:** Derive status client-side from raw Prisma relation — rejected because it duplicates mapping logic and diverges from detail.

### 2. Extract a shared `SpeechPublicationStatusBadge` component

`speech-publishing-card.tsx` already exports `PublicationSummary`, `getPublicationStatusLabel`, and defines `PUBLICATION_STATUS_VARIANTS`. Extract a small badge component (either in the same file or `_components/speech-publication-status-badge.tsx`) mirroring `SpeechProcessStatusBadge`, and use it in both the list table and optionally the publishing card.

**Alternative:** Inline badge in `speeches-table.tsx` only — rejected to keep label/variant parity with detail.

### 3. Column order and headers

Table columns: Script | Voice | Language | Length | Process | Publication | Updated

Rename **Status** → **Process** for the TTS process badge column; add **Publication** after it.

### 4. Loading skeleton

Add a badge-shaped skeleton cell in `speeches/loading.tsx` for the publication column and rename the process status header to **Process**.

## Risks / Trade-offs

- **[Extra join on list query]** → Lightweight 1:1 optional relation; acceptable for CMS list size.
- **[Stale list after publish on detail]** → User navigates back to list; server component refetches on navigation. No client cache on list page today.

## Migration Plan

No migration. Deploy as a single frontend + tRPC change. Rollback by reverting the commit.

## Open Questions

None.
