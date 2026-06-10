## Context

Async speech TTS (`speech-tts-jobs`) already persists `Speech.totalChunks` and `Speech.settledChunks` as chunks are synthesized and settled. The CMS speech detail page polls `speeches.getById` every 3 seconds while `processStatus` is `pending` or `processing`, but `SpeechAudioSection` in `speech-detail.tsx` renders a static "Generating audio" card with no progress.

The async TTS design doc listed chunk progress UI as an optional follow-up using these counters. No backend or queue changes are required.

## Goals / Non-Goals

**Goals:**

- Show meaningful generation progress on the speech detail page using existing DB fields.
- Display percentage and chunk fraction (e.g. 25%, 3 of 12) during chunk synthesis.
- Handle edge phases: before chunks are split (`pending`, `totalChunks === 0`), and after all chunks settle but before `finished` (finalize step).
- Keep polling behavior unchanged; progress updates as poll responses refresh counters.

**Non-Goals:**

- Per-chunk status breakdown UI (individual chunk rows or a log).
- WebSocket or SSE for real-time updates (polling is sufficient for v1).
- Progress on create page or elsewhere beyond detail (list column enhancement is optional stretch, not required for v1).
- Changing queue workers, Prisma schema, or Modal deployment.

## Decisions

### Progress calculation from `settledChunks` / `totalChunks`

**Decision:** Derive UI progress in a shared helper `getSpeechGenerationProgress(processStatus, totalChunks, settledChunks)` in `src/lib/speech-generation-progress.ts`.

| Phase        | Condition                                          | UI                                                                                                  |
| ------------ | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Starting     | `pending` OR `totalChunks === 0`                   | Indeterminate or 0% bar; label "Starting generation…"                                               |
| Synthesizing | `processing` AND `0 < settledChunks < totalChunks` | Percent = `round(settledChunks / totalChunks * 100)`; label includes percentage and "X of Y chunks" |
| Finalizing   | `processing` AND `settledChunks === totalChunks`   | 100% bar; label "Finalizing audio…" (concat + upload running)                                       |

**Rationale:** `settledChunks` increments when each chunk reaches `done` or `failed`; during normal synthesis it tracks completed work. When all chunks are settled but status is still `processing`, the finalize consumer is running — showing 100% with a distinct label avoids the appearance of a stall.

**Alternative:** Count only `done` chunks via a new query or field — rejected; adds API/DB work without meaningful accuracy gain (failed chunks trigger failure shortly after settlement).

### UI component

**Decision:** Use the existing shadcn `Progress` bar in the generating card, plus title/description text from the helper.

**Alternative:** Circular spinner only — rejected; user asked for percentage.

### API surface

**Decision:** No new tRPC fields or procedures. `speeches.getById` already spreads the full Prisma `Speech` row (includes `totalChunks`, `settledChunks`). Update the `speeches` spec to require these fields explicitly in the detail response while in progress.

**Alternative:** Dedicated `speeches.getProgress` query — rejected as unnecessary.

### List page status column

**Decision:** Out of scope for v1 implementation tasks; detail page is the primary UX. Spec allows optional list enhancement in a follow-up.

## Risks / Trade-offs

- **[Progress jumps in steps]** → Each chunk completion updates `settledChunks` by 1; long scripts with few large chunks may show coarse jumps. Acceptable for v1; chunk count text sets expectations.
- **[Finalize phase shows 100% while work remains]** → Label "Finalizing audio…" distinguishes concat/upload from synthesis; finalize is typically short relative to TTS.
- **[Brief 0% after redirect from create]** → `pending` with `totalChunks === 0` until start job runs; "Starting generation…" covers this window.

## Migration Plan

1. Ship UI + helper + spec updates together (no migration or deploy ordering constraints).
2. Rollback: revert UI; no data impact.

## Open Questions

- None blocking v1.
