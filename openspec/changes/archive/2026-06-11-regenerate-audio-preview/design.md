## Context

The speech detail page shows a waveform **Audio preview** when `processStatus` is `finished`, and a generating card while `pending` or `processing`. Users report hanging waveforms, wrong finished audio, and stuck in-flight generation.

Recovery today is split across **Retry** (`speeches.retry`, `failed` only) and no action for broken finished or stuck in-flight speeches. There is no `processingStartedAt` field yet, so stuck-duration rules cannot be enforced without a schema addition.

Existing patterns:

- `speeches.retry` — deletes temp chunk R2 keys, deletes all `SpeechChunk` rows, resets counters, enqueues `speech-tts-start`.
- `runSpeechTtsStart` — transitions `pending` → `processing`, creates fresh chunk rows.
- Finalize — deletes temp chunk files after assembling the final WAV; chunk DB rows may remain until explicit cleanup.

## Goals / Non-Goals

**Goals:**

- Let CMS users regenerate from the detail page for finished speeches and eligible in-flight speeches.
- On regenerate, fully clean up all existing `SpeechChunk` rows and their temp R2 objects, plus the final WAV and alignment when present.
- Gate in-flight regenerate: allow when `processingStartedAt` is null (legacy) or at least 30 minutes ago (stuck).
- Track `processingStartedAt` on new processing runs.

**Non-Goals:**

- Changing TTS parameters on regenerate.
- Regenerating voice preview audio on voice detail pages.
- Regenerating `processing` speeches that started less than 30 minutes ago (protect active jobs).
- Client-side waveform-only reload without re-running TTS.

## Decisions

### 1. New `speeches.regenerate` (separate from `retry`)

`speeches.regenerate` accepts:

| `processStatus` | Eligible when                                                                 |
| --------------- | ----------------------------------------------------------------------------- |
| `finished`      | Always                                                                        |
| `pending`       | Always (`processingStartedAt` typically null)                                 |
| `failed`        | Always                                                                        |
| `processing`    | `processingStartedAt` is null **or** `processingStartedAt ≤ now − 30 minutes` |

Keep `speeches.retry` for backward compatibility; it performs the same reset path for `failed` speeches. New UI uses `speeches.regenerate` for all recovery actions.

**Rationale:** One regenerate endpoint covers every recoverable state; shared internal reset helper.

### 2. Full chunk and storage cleanup on regenerate

On every successful regenerate:

1. Collect all `SpeechChunk.tempR2Key` values and delete those objects from storage.
2. Delete final WAV at `r2ObjectKey` if it exists (finished or partial finalize).
3. In a transaction: `deleteMany` all `SpeechChunk` rows; clear `alignment`; reset `totalChunks` / `settledChunks` to 0; clear `errorMessage`; set `processStatus` to `pending`; clear `processingStartedAt`.
4. Enqueue `speech-tts-start`.

**Rationale:** User requirement — no leftover chunk artifacts. Matches retry pattern plus final WAV removal.

### 3. Add `processingStartedAt` to `Speech`

- Nullable `DateTime` on `Speech`.
- Set to `now()` in `runSpeechTtsStart` when updating `processStatus` to `processing`.
- Cleared when regenerate/retry resets to `pending`.
- Legacy rows with null value remain eligible for in-flight regenerate.

**Rationale:** Enables the 30-minute stuck threshold without inferring from `updatedAt`.

### 4. Regenerate control placement

- **Finished** — Audio preview card (and waveform load-error state).
- **Pending / processing** — Generating card when server marks speech as regenerate-eligible (expose `canRegenerate` from API or derive from `processStatus` + `processingStartedAt` in `getById`).

Show confirmation dialog before mutate (replaces audio / restarts pipeline).

### 5. Reset stable audio URL on regenerate

Clear stabilized `audioUrl` in `SpeechDetailClient` when regenerate succeeds so new audio loads after completion.

## Risks / Trade-offs

- **[In-flight jobs after regenerate]** → Old chunk/finalize jobs may no-op on missing chunks; finalize idempotency already specified.
- **[Regenerate during active processing < 30 min]** → Rejected server-side; UI hides or disables control.
- **[Storage delete partial failure]** → Fail before DB reset when storage step fails (same as retry/delete).
- **[Legacy null `processingStartedAt` on processing]** → Eligible immediately; acceptable for recovery of pre-migration rows.

## Migration Plan

1. Add nullable `processingStartedAt` column (no backfill required).
2. Deploy API + job changes, then CMS UI.
3. Rollback: remove regenerate endpoint/UI; column can remain unused.

## Open Questions

- None. Threshold is fixed at 30 minutes; adjust later via config if needed.
