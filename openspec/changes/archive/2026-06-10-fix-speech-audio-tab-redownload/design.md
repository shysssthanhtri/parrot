## Context

The speech detail page (`SpeechDetailClient`) loads data via React Query (`speeches.getById`). The query uses `refetchInterval` while `processStatus` is `pending` or `processing`, and React Query's default `refetchOnWindowFocus: true` applies on every tab return once data is stale (30s `staleTime`).

Each `getById` response includes a freshly minted presigned GET URL (`getAudioUrl`), even when the underlying `r2ObjectKey` is unchanged. That URL is passed through `SpeechScriptPlaybackPanel` → `VoiceAudioPreview` → `useWavesurfer({ url: audioUrl })`. WaveSurfer treats any URL change as a new source and re-fetches/decodes the full file.

Voice detail avoids this because the presigned URL is generated once on the server during page render; there is no client refetch cycle.

Presigned URLs expire after 3600 seconds (`PRESIGN_EXPIRES_IN_SECONDS` in `src/lib/storage/r2.ts`), which is long enough that reusing the first URL for a single detail-page session is safe.

## Goals / Non-Goals

**Goals:**

- Prevent unnecessary audio re-download when the user switches browser tabs on a finished speech detail page.
- Preserve waveform load state and playback position across tab refocus.
- Keep polling and metadata refresh working for in-progress and failed speeches.

**Non-Goals:**

- Changing R2 presigning, storage drivers, or tRPC response shape.
- Fixing the same issue on voice detail (not reported; server-rendered URL is already stable).
- Long-lived sessions beyond presigned URL expiry (1 hour); a separate refresh strategy is out of scope unless playback fails.

## Decisions

### 1. Stabilize `audioUrl` in `SpeechDetailClient` keyed by storage identity

Hold the first non-null `audioUrl` in component state (or a ref + state) and only replace it when the speech's audio storage identity changes—e.g. `r2ObjectKey` changes, `processStatus` crosses from non-playable to `finished`, or `audioUrl` was previously null and becomes available.

**Rationale:** WaveSurfer only reloads when its `url` prop changes. Ignoring cosmetic presign churn fixes the bug without API changes.

**Alternatives considered:**

- **Disable `refetchOnWindowFocus` globally or for this query only** — reduces refetches but does not fix reload when polling completes or manual refetch runs while audio is already loaded.
- **Stable proxy URL (`/api/audio/...`)** — correct long-term but adds a new route and auth/streaming concerns; too heavy for this bug.
- **Compare presigned URLs ignoring query params** — fragile; signature differs even for same object.

### 2. Set `refetchOnWindowFocus: false` when speech is finished

In `SpeechDetailClient`, pass `refetchOnWindowFocus: false` when `processStatus === "finished"` (and optionally `failed`). Keep default focus refetch while in progress so status updates promptly if the user returns mid-generation.

**Rationale:** Finished speeches have no reason to refetch on every tab switch; metadata is read-only. This reduces server load and avoids edge cases where other fields update unnecessarily.

### 3. No changes to `VoiceAudioPreview` unless needed

Prefer fixing at the data layer (`SpeechDetailClient`) so all consumers of stable URLs benefit and WaveSurfer stays a dumb player.

If stabilization logic grows, extract a small `useStableAudioUrl(audioUrl, storageKey)` hook in the speeches module.

## Risks / Trade-offs

- **[Stale presigned URL after 1h on same tab]** → Acceptable for CMS preview; user can refresh the page. WaveSurfer error state already offers "Open audio in new tab".
- **[Missed metadata update on finished speech while tab focused elsewhere]** → Low impact; speech detail is read-only and `updatedAt` is not critical in v1.
- **[State reset on full page navigation]** → Expected; stabilization is per mount, not cross-route cache.

## Migration Plan

No migration. Deploy as a client-side fix only. Rollback is reverting the `SpeechDetailClient` query options and URL stabilization.

## Open Questions

None — root cause and fix are well understood.
