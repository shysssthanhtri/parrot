## 1. Schema and jobs — processingStartedAt

- [x] 1.1 Add nullable `processingStartedAt DateTime?` to `Speech` in Prisma schema and run migration
- [x] 1.2 Set `processingStartedAt` to `now()` in `runSpeechTtsStart` when transitioning to `processing`
- [x] 1.3 Clear `processingStartedAt` in retry/regenerate reset paths

## 2. API — speech regenerate

- [x] 2.1 Extract shared reset helper: delete all `SpeechChunk.tempR2Key` objects, `deleteMany` chunk rows, reset counters/status, clear `processingStartedAt`
- [x] 2.2 Implement `speeches.regenerate` with eligibility: `finished`/`pending`/`failed` always; `processing` when `processingStartedAt` is null or ≥ 30 minutes ago; reject only recent `processing`
- [x] 2.3 On regenerate, also delete final WAV at `r2ObjectKey` and clear `alignment` before enqueueing start job
- [x] 2.4 Expose `processingStartedAt` (and optionally `canRegenerate`) from `speeches.getById` for CMS gating

## 3. CMS — regenerate UI on speech detail

- [x] 3.1 Add `regenerateMutation` in `speech-detail-client.tsx` with toast, refetch, and stable `audioUrl` reset on success
- [x] 3.2 Pass `onRegenerate` / `isRegenerating` / eligibility through `SpeechDetail` to finished audio preview, failed state, and eligible generating cards
- [x] 3.3 Add **Regenerate** button with confirmation dialog on audio preview, failed state, and eligible generating state
- [x] 3.4 Surface **Regenerate** in waveform error state when load fails

## 4. Verification

- [ ] 4.1 Manually test finished speech: Regenerate → generating → new audio loads
- [ ] 4.2 Manually test pending speech: Regenerate cleans chunks and restarts
- [ ] 4.3 Manually test processing speech: eligible after 30+ min or null timestamp; rejected when recent
- [ ] 4.4 Manually test failed speech: Regenerate cleans chunks and restarts generation
