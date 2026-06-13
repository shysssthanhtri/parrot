## Why

Speech publishing was added to the CMS detail page, but the speeches list table at `/cms/speeches` still only shows TTS process status (`pending`, `processing`, `finished`, `failed`). Authors cannot see at a glance which speeches are live in the learner catalog versus draft or unpublished, forcing them to open each detail page to check publication state.

## What Changes

- Add a **Publication** column to the CMS speeches list table showing `Not published`, `Published`, or `Unpublished` with badge styling consistent with the speech detail page
- Extend `speeches.list` to include publication summary per row (same shape as detail: `not_published` or `published` / `unpublished`)
- Update the speeches list loading skeleton to include the new column
- Rename or clarify the existing **Status** column header to **Process** (or equivalent) so process status and publication status are distinguishable

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `cms-speeches`: List page table and loading skeleton gain a publication status column; list API requirement updated to return publication summary per speech
- `speeches`: `speeches.list` query returns publication summary for each row

## Impact

- **API**: `speeches.list` tRPC query — add `publication` include and map to summary shape
- **CMS UI**: `speeches-table.tsx`, `speeches/loading.tsx`
- **Shared UI**: Reuse publication badge/label helpers from `speech-publishing-card.tsx` (or extract a small shared badge component)
- **Specs**: Delta updates to `cms-speeches` and `speeches` capability specs
- **No schema migration** — `SpeechPublication` already exists
