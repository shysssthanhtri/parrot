## Why

Finished speech audio previews sometimes hang on "Loading waveform…" or play incorrect audio even though generation reported success. In-flight generation can also stall in `pending` or `processing`, and failed speeches need a full restart — today recovery is fragmented across status-specific controls.

## What Changes

- Add a **Regenerate** control on the speech detail page for finished speeches (audio preview) and for in-flight speeches when eligible.
- Expose `speeches.regenerate` to re-run full TTS: delete all `SpeechChunk` rows, delete every referenced temp R2 object, delete the final WAV when present, clear alignment, reset progress, enqueue a new start job.
- Accept `finished`, `pending`, and `failed` speeches unconditionally.
- Accept `processing` speeches when `processingStartedAt` is null (legacy rows) or `processingStartedAt` is at least 30 minutes before now (stuck in-flight recovery).
- Add nullable `processingStartedAt` on `Speech`; set when the start job transitions a speech to `processing`; clear when reset to `pending`.
- After regenerate, the detail page returns to the existing generating/polling UX until the new audio is ready.

## Capabilities

### New Capabilities

<!-- None — extends existing speech regeneration behavior in place -->

### Modified Capabilities

- `speeches`: Add `processingStartedAt` field; add regenerate API with status/time eligibility and full chunk + storage cleanup.
- `cms-speeches`: Add regenerate control on audio preview and generating state (when server-eligible); wire polling and preview refresh.
- `speech-tts-jobs`: Set `processingStartedAt` on start; document regenerate restart behavior for all eligible statuses.

## Impact

- **Database**: Prisma migration adding `Speech.processingStartedAt` (nullable `DateTime`).
- **API**: `src/trpc/routers/speeches.ts` — new `speeches.regenerate` mutation.
- **Jobs**: `src/lib/speech-tts-processing.ts` — set/clear `processingStartedAt`.
- **CMS UI**: `speech-detail.tsx`, `speech-detail-client.tsx`, possibly playback panel / waveform error UI.
- **Storage**: Deletes final WAV, all temp chunk objects, and all chunk rows before re-processing.
