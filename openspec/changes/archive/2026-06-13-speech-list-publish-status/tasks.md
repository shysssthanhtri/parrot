## 1. API — speeches.list publication summary

- [x] 1.1 Add `publication: { select: { status: true, publishedAt: true } }` to `speechListInclude` in `src/trpc/routers/speeches.ts`
- [x] 1.2 Map each list row to `PublicationSummary` (same logic as `getById`: `not_published` when no row, otherwise `status` + `publishedAt`)

## 2. Shared publication badge

- [x] 2.1 Extract `SpeechPublicationStatusBadge` (labels + variants from `speech-publishing-card.tsx`) into `_components/speech-publication-status-badge.tsx` or export from the publishing card module
- [x] 2.2 Reuse the shared badge in `speech-publishing-card.tsx` if it currently inlines badge rendering

## 3. CMS speeches list table

- [x] 3.1 Extend `SpeechRow` in `speeches-table.tsx` with `publication: PublicationSummary`
- [x] 3.2 Rename **Status** column header to **Process**; add **Publication** column with `SpeechPublicationStatusBadge`

## 4. Loading skeleton

- [x] 4.1 Update `src/app/(cms)/cms/speeches/loading.tsx` — rename **Status** to **Process**, add **Publication** column skeleton cell
