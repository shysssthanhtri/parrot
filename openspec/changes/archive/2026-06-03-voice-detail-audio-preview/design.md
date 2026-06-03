## Context

The CMS voice detail page (`/cms/voices/[voiceId]`) is a server component that loads voice metadata via tRPC and, when `r2ObjectKey` is set, resolves a presigned GET URL via `getAudioUrl` in `src/lib/r2.ts`. `VoiceDetail` currently renders a full-width native `<audio controls>` element. The page already splits server data fetching from UI; other CMS tables use leaf `"use client"` components (`voices-table.tsx`).

Presigned URLs are time-limited (~1h). WaveSurfer loads audio in the browser from that URL; CORS on the R2 bucket must allow GET from the CMS origin (same constraint as today’s `<audio>` element).

## Goals / Non-Goals

**Goals:**

- Waveform visualization with click-to-seek on the voice detail preview card
- Play/pause control and elapsed/total time formatted for humans (e.g. `0:12 / 0:45`)
- Styling aligned with shadcn/Tailwind (wave colors from CSS variables or theme tokens where practical)
- Clean lifecycle: destroy WaveSurfer instance on unmount; show loading and error states if fetch/decode fails
- Keep `VoiceDetail` as mostly server-rendered; isolate WaveSurfer in a dedicated client component

**Non-Goals:**

- Changing presign TTL, R2 upload, or voice APIs
- Playlist / multi-track player, volume mixer, or download button
- Regenerating presigned URLs client-side when TTL expires (future enhancement)
- Audio editing, trimming, or transcoding

## Decisions

### 1. Library: `wavesurfer.js` + `@wavesurfer/react`

**Choice:** Add `wavesurfer.js` (v7) and the official `@wavesurfer/react` package.

**Rationale:** User-requested direction; mature waveform UX (seek, progress cursor, responsive resize). Official React bindings match React 19 peer deps and avoid hand-rolled `useEffect` + `destroy()` bugs.

**Alternatives considered:**

- **Native `<audio>` only** — no waveform; rejected.
- **Peaks.js / howler-only** — viable but less direct waveform story; WaveSurfer is the stated preference.
- **Manual `WaveSurfer.create` in `useEffect`** — more boilerplate; `@wavesurfer/react` is maintained by the same author.

### 2. Component boundary

**Choice:** New client component e.g. `VoiceAudioPreview` in `src/app/(cms)/cms/voices/[voiceId]/_components/voice-audio-preview.tsx`. `VoiceDetail` stays a server component and passes `audioUrl: string` as a prop when preview is shown.

**Rationale:** Matches existing CMS pattern (server page → client leaf). Minimizes client bundle to the preview card only.

### 3. Controls and layout

**Choice:** Card content layout: waveform container (fixed height ~80–100px), row below with shadcn `Button` (icon play/pause from `lucide-react`) and monospace or `text-sm` time labels driven by WaveSurfer `timeupdate` / `ready` events.

**Rationale:** Spec requires transport + duration; native controls are fully replaced.

**Optional:** Skip Timeline/Hover plugins in v1 to limit bundle size; click-to-seek on waveform is built into WaveSurfer core.

### 4. Theming

**Choice:** Map `waveColor` / `progressColor` to Tailwind CSS variables (e.g. `hsl(var(--muted-foreground))` and `hsl(var(--primary))`) so light/dark themes stay consistent.

### 5. Loading and error UX

**Choice:** While `url` loads/decodes, show skeleton or muted “Loading waveform…” in the card. On `error` event, show inline message and fallback link to open audio URL in new tab (optional safety net).

**Rationale:** Presigned failures or CORS misconfiguration should not leave a blank card.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Larger client JS bundle | Single preview per page; no dynamic import required for v1 but can add `next/dynamic` with `ssr: false` if bundle audit flags it |
| Presigned URL expires during long CMS session | Document limitation; user refreshes page (same as native audio today) |
| R2 CORS blocks WaveSurfer fetch | Verify bucket CORS allows CMS origin; same URL works for `<audio>` first |
| WaveSurfer double-init on strict mode | Use `@wavesurfer/react` lifecycle; destroy on unmount |
| WAV decode on large files | Acceptable for CMS samples; show loading state |

## Migration Plan

1. Install dependencies.
2. Add `VoiceAudioPreview` client component; swap into `VoiceDetail` audio card.
3. Manual test: voice with audio, voice without `r2ObjectKey`, play/pause/seek, theme toggle if applicable.
4. Rollback: revert component and remove deps (no data migration).

## Open Questions

- None blocking v1. Optional follow-up: client-side presign refresh before TTL expiry if editors keep detail open >1h.
