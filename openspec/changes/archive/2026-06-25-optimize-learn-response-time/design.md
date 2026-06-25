## Context

Production `[learn-timing]` logs (June 2026) on `parrot-chi.vercel.app` show `/learn` warm loads at **213–319 ms** total for 5 published speeches. Breakdown:

| Segment      | Warm range             | Notes                                        |
| ------------ | ---------------------- | -------------------------------------------- |
| `auth`       | 22–38 ms               | NextAuth session + Prisma user lookup        |
| `db`         | 4–12 ms                | Prisma `findMany` — not a bottleneck         |
| `thumbnails` | 187–505 ms             | Dominates total; wall-clock of parallel work |
| `exists`     | 830–2252 ms cumulative | Sum of per-item R2 `HeadObject` calls        |
| `presign`    | 5–10 ms                | Already cheap                                |

Cold first request: **1504 ms** (`auth=905 ms`) — serverless cold start; out of scope for this change.

Current `speechPublications.list` (`src/trpc/routers/speech-publications.ts`) resolves each thumbnail with:

1. `objectExists(thumbnailR2ObjectKey)` → R2 `HeadObject` (~150–450 ms wall per batch of 5 in parallel)
2. `getAudioUrl(thumbnailR2ObjectKey)` → local presign (~1–2 ms each)

Publish flow already verifies thumbnail existence via `assertSpeechReadyToPublish` before snapshotting `thumbnailR2ObjectKey` (`src/lib/speech-publish-readiness.ts`, `buildPublicationSnapshot`). The runtime exists check on list is redundant for normal operations.

## Goals / Non-Goals

**Goals:**

- Cut `/learn` warm server time by eliminating N R2 `HeadObject` round-trips per list call.
- Preserve existing API shape (`thumbnailUrl` on each list item).
- Keep prod timing logs for verification.

**Non-Goals:**

- Serverless cold-start / auth latency optimization.
- Client carousel or image-loading window changes (already addressed separately).
- Public CDN URLs for thumbnails (would require R2 public bucket setup).
- Changing `getById` audio/thumbnail resolution (list-only optimization).
- `unstable_cache` / cross-request list caching (follow-up if needed after measuring).

## Decisions

### 1. Trust snapshot `thumbnailR2ObjectKey` on list — skip `objectExists`

**Decision:** When `thumbnailR2ObjectKey` is non-null, presign directly via `getAudioUrl` without a preceding `HeadObject`.

**Rationale:** Publish readiness already confirmed storage at snapshot time. Removes the dominant cost (5× parallel HeadObject ≈ 200–500 ms).

**Alternatives considered:**

- **Keep exists check** — rejected; prod logs prove it dominates.
- **Batch HeadObject** — R2 has no batch HEAD API; rejected.
- **Store `thumbnailUrl` in DB at publish** — rejected; signed URLs expire (3600 s); would need refresh logic anyway.

### 2. In-process presigned-URL cache with TTL

**Decision:** Add `getCachedPresignedGetUrl(key)` in `src/lib/storage/r2.ts` (or sibling) using a module-level `Map<string, { url, expiresAt }>`. TTL = presign expiry minus 5-minute buffer (3300 s). Used by list thumbnail resolution path.

**Rationale:** Repeated `/learn` visits on the same warm serverless instance avoid redundant signing. Low complexity, no new dependencies.

**Alternatives considered:**

- **React `cache()` only** — dedupes within one request, not across navigations.
- **`unstable_cache`** — better cross-request caching but adds Next.js coupling to storage layer; defer until post-deploy metrics.

### 3. Leave `getById` unchanged

**Decision:** Keep exists-then-presign for `getById` audio and thumbnail resolution.

**Rationale:** Detail view is on-demand, single item; list is the `/learn` critical path. Audio existence still matters for playback UX.

### 4. Preserve timing segments

**Decision:** Keep `[learn-timing]` instrumentation; `exists` segment should drop to ~0 ms on list after this change.

## Risks / Trade-offs

- **[Stale thumbnail after manual storage delete]** → Rare ops path; client image 404s same as broken signed URL today. Mitigation: normal delete flows go through app code.
- **[Presigned URL cache memory]** → Bounded by distinct keys in catalog (small). Entries expire automatically.
- **[Serverless cache hit rate]** → Cache only helps warm instances; primary win is skipping HeadObject regardless.

## Migration Plan

1. Implement storage cache helper and update `speechPublications.list`.
2. Deploy to preview; compare `[learn-timing]` before/after (expect `thumbnails` ≈ `presign`, `exists` ≈ 0).
3. Rollback: revert list handler and cache helper; no data migration.

## Open Questions

None — prod timing data is sufficient to proceed.
