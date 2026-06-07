## Context

Parrot uses Next.js App Router with a CMS at `/cms/*` (NextAuth-protected), Prisma on PostgreSQL, tRPC for data fetching, and a storage abstraction (`local` in dev, `r2` in production). Voices and scripts are shipped with list/detail (and script create/edit) pages. The Chatterbox TTS client (`src/lib/chatterbox/generateSpeech`) calls Modal `POST /generate` with `prompt`, `voice_key`, and sampling parameters.

The sidebar already links to `/cms/speeches`, but there is no `Speech` model, router, or pages yet.

## Goals / Non-Goals

**Goals:**

- Persist generated speech metadata and audio object keys in PostgreSQL
- tRPC `speeches.list`, `getById`, `create`, and `generatePreview` for CMS
- CMS list at `/cms/speeches` (table + **New speech** → `/cms/speeches/new`)
- CMS create page: language → matching voice/script → TTS sliders → preview/regenerate → save
- CMS read-only detail at `/cms/speeches/[speechId]` with metadata and waveform preview
- Route helpers `SPEECH_NEW` and `SPEECH_DETAIL(id)`
- Reuse existing storage driver for speech audio (`uploadObject`, `getAudioUrl`)

**Non-Goals:**

- Edit, archive, or delete speeches
- Client-side/browser calls to Chatterbox (API key stays server-side)
- Batch generation, job queue, or caching of TTS results
- Displaying creator/`createdBy` in CMS
- Validating script language against voice at the schema level (enforced in create/preview APIs only)

## Decisions

### Prisma `Speech` model

Add `Speech` with:

| Field                     | Type                 | Notes                                                       |
| ------------------------- | -------------------- | ----------------------------------------------------------- |
| `id`                      | cuid                 | Primary key                                                 |
| `voiceId`                 | String FK → `Voice`  | Required                                                    |
| `scriptId`                | String FK → `Script` | Required                                                    |
| `language`                | String               | Same BCP-47 codes as scripts (`en-US`, …)                   |
| `temperature`             | Float                | Default 0.8                                                 |
| `topP`                    | Float                | Default 0.95                                                |
| `topK`                    | Int                  | Default 1000                                                |
| `repetitionPenalty`       | Float                | Default 1.2                                                 |
| `normLoudness`            | Boolean              | Default true                                                |
| `r2ObjectKey`             | String               | Storage key for generated WAV                               |
| `userId`                  | String FK → `User`   | Required; every speech is user-created (no system speeches) |
| `createdAt` / `updatedAt` | DateTime             | Timestamps                                                  |

Add `speeches Speech[]` on `User`; add `speeches Speech[]` on `Voice` and `Script` for relation navigation in detail queries.

**Alternative:** Store TTS params as JSON — rejected; explicit columns match Chatterbox fields and are easy to display on detail.

**Alternative:** Denormalize script title / voice name — rejected; join on read for detail/list.

### Storage key layout

Upload generated WAV as `speeches/{speechId}.wav` via `uploadObject(key, buffer, "audio/wav")`. The storage driver selects local filesystem (`.local-storage/`) or R2 based on `STORAGE_DRIVER`.

**Alternative:** Content-addressed keys (hash of params) — rejected; one speech row maps to one canonical object key.

### TTS slider config

Add `src/lib/speech-sliders.ts` mirroring the Resonance slider definitions. Each slider entry SHALL include a `description` string used as tooltip copy on the create page:

| id                  | label            | min | max   | step | default | tooltip (summary)                                                                            |
| ------------------- | ---------------- | --- | ----- | ---- | ------- | -------------------------------------------------------------------------------------------- |
| `temperature`       | Creativity       | 0   | 2     | 0.1  | 0.8     | How much the delivery varies between runs; lower is steadier, higher is more expressive      |
| `topP`              | Voice Variety    | 0   | 1     | 0.05 | 0.95    | How wide the model's word choices are; lower stays closer to the most likely phrasing        |
| `topK`              | Expression Range | 1   | 10000 | 100  | 1000    | How many candidate words are considered; lower is subtler, higher allows bolder delivery     |
| `repetitionPenalty` | Natural Flow     | 1   | 2     | 0.1  | 1.2     | How strongly repeated phrasing is avoided; lower can sound more rhythmic, higher more varied |

Include a `normLoudness` toggle (default on) with its own tooltip explaining that it normalizes output volume for consistent playback. Map camelCase app fields to snake_case Chatterbox body (`top_p`, `top_k`, `repetition_penalty`, `norm_loudness`).

On the create form, each slider label SHALL show an info icon (or similar affordance) with a shadcn `Tooltip` displaying the slider's `description`.

### tRPC router

New `src/trpc/routers/speeches.ts` on `appRouter`:

- **`list`**: `findMany({ orderBy: { updatedAt: 'desc' }, include: { voice: { select: { name: true } }, script: { select: { title: true } } } })` for table columns
- **`getById`**: `findUnique` with `voice` and `script` includes + `NOT_FOUND`; server resolves `getAudioUrl(r2ObjectKey)` for preview URL
- **`generatePreview`**: mutation accepting `voiceId`, `scriptId`, `language`, and TTS params. Validates voice and script exist, languages match the selected language, voice has `r2ObjectKey`. Calls `generateSpeech({ prompt: script.content, voice_key: voice.r2ObjectKey, … })`. Returns `{ audioBase64: string }` (WAV as base64) for client preview player
- **`create`**: mutation with same inputs as preview. Re-runs generation server-side (ensures stored audio matches saved config), uploads to `speeches/{id}.wav`, inserts `Speech` row with `userId` from the authenticated session. Returns created speech with relations

Use Zod schemas shared between preview and create. Reject voices without `r2ObjectKey`.

**Alternative:** Upload preview buffer on create without re-generating — rejected; server-side regenerate on save avoids stale client preview vs saved config drift and keeps create input small.

**Alternative:** Temporary preview storage with presigned URL — rejected; base64 in tRPC response is simpler for v1 preview-only flow.

### CMS routes

```
/cms/speeches              → list
/cms/speeches/new          → create wizard (static route before [speechId])
/cms/speeches/[speechId]   → read-only detail + preview
```

Add `SPEECH_NEW` and `SPEECH_DETAIL(id)` to `routes.ts`.

### CMS create page UX

Single client-heavy page (`speech-create-form.tsx`) with ordered sections:

1. **Language** — select with the five script language options (default English)
2. **Voice** — combobox/select listing voices where `language` matches selection and `r2ObjectKey` is set; disabled until language chosen
3. **Script** — combobox/select listing scripts where `language` matches selection; disabled until language chosen
4. **TTS settings** — slider controls from `speech-sliders.ts` plus norm loudness toggle; each control has a tooltip explaining what the setting does
5. **Generate** — calls `speeches.generatePreview`; shows loading state; on success renders inline waveform player (reuse `VoiceAudioPreview` or extract shared `AudioPreview` accepting a blob/data URL)
6. **Regenerate** — same as Generate; enabled when voice, script, and language are valid; slider changes invalidate prior preview visually (optional subtle hint) but do not auto-regenerate
7. **Save** — calls `speeches.create` with current config; disabled until at least one successful preview in the session (or until voice/script/language valid — prefer requiring preview so user hears output before save). On success redirect to `SPEECH_DETAIL(id)`

Fetch voice/script options via existing `voices.list` and `scripts.list` (client-side filter by language).

**Alternative:** Multi-step wizard routes — rejected; one page with sections matches script create complexity.

### CMS list page UX

Mirror scripts list: server component, tRPC caller, shadcn table columns at minimum: script title, voice name, language label, updated date. Row click → detail. **New speech** button → `/cms/speeches/new`. Loading skeleton matching columns.

### CMS detail page UX

Server component loads `speeches.getById`. Read-only layout showing script title, voice name, language label, TTS parameter values, timestamps. Waveform player via presigned/local URL from `getAudioUrl`. No edit controls. `not-found.tsx` for missing id.

Extract or reuse `VoiceAudioPreview` for speech preview on detail (same wavesurfer behavior as voices).

## Risks / Trade-offs

| Risk                                            | Mitigation                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| Chatterbox latency on preview/create            | Loading states; disable double-submit                                   |
| Voice missing `r2ObjectKey`                     | Filter from voice picker; API rejects with clear error                  |
| Language mismatch voice/script                  | Filter pickers client-side; validate server-side on preview/create      |
| Large base64 preview payloads                   | Acceptable for CMS v1; long scripts may produce large WAV — monitor     |
| Re-generate on save doubles API cost vs preview | Ensures stored audio matches saved params; acceptable for v1            |
| No delete                                       | Orphan storage objects possible if manual DB cleanup — add delete later |

## Migration Plan

1. Add `Speech` model and migration
2. Ship tRPC router and CMS pages
3. No seed data required
4. Rollback: remove pages/router; migration rollback drops `Speech` table

## Open Questions

- None for v1 — edit/delete and preview caching are follow-ups.
