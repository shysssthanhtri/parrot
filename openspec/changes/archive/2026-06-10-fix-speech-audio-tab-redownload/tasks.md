## 1. Stabilize audio URL on speech detail

- [x] 1.1 ~~In `speech-detail-client.tsx`, track a stable preview URL~~ — skipped; global `refetchOnWindowFocus: false` is sufficient
- [x] 1.2 ~~Pass the stable URL to `SpeechDetail`~~ — skipped
- [x] 1.3 ~~Reset stable URL state when `speechId` prop changes~~ — skipped

## 2. Tune React Query refetch behavior

- [x] 2.1 Set `refetchOnWindowFocus: false` globally in `src/trpc/query-client.ts`
- [x] 2.2 Keep existing `refetchInterval` polling unchanged for `pending` and `processing` speeches

## 3. Verification

- [ ] 3.1 Manually test finished speech: play audio, switch tabs, return — confirm no "Loading waveform…" flash and no duplicate network download in DevTools
- [ ] 3.2 Manually test in-progress speech: confirm polling still updates status until finished, then audio loads once
- [ ] 3.3 Manually test failed speech retry: confirm new audio loads after successful regeneration
