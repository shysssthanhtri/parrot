## Context

Parrot's CMS produces speeches via async TTS (`Speech`, `SpeechChunk`, `processStatus`, alignment JSON, R2 audio). Scripts and topics remain editable after a speech is generated. There is no publication layer today — learners cannot browse shadowing content, and CMS detail pages only support preview/regenerate/delete.

Exploration decisions locked for v1:

- **Separate `SpeechPublication` entity** in PostgreSQL (not Redis, not fields-only on `Speech`).
- **Snapshot on publish** — learners never read live `Script` / `Speech` rows.
- **No scheduled publish**, no version history.
- **Republish updates the same row** (upsert on `speechId`), refreshing snapshot and `publishedAt`.
- **Block regenerate/delete when published**; offer **Unpublish and regenerate** as one atomic CMS action.
- **No auto-republish** after regeneration — author publishes manually when audio is ready.
- **Many speeches per script** allowed (different voices); catalog shows each publication as its own card.
- Learners browse by **topic** and **language** (API in scope; learner UI out of scope).

Existing patterns to mirror:

- tRPC routers: `src/trpc/routers/speeches.ts`, `cmsProcedure` / `authProcedure` in `src/trpc/init.ts`
- Regenerate reset: `src/lib/speech-regenerate.ts`
- Alignment type: `src/lib/speech-script-alignment.ts`
- Audio URLs: `getAudioUrl` from `src/lib/storage`
- CMS detail UX: `speech-detail-client.tsx`, `speech-regenerate-button.tsx` (AlertDialog confirmations)

## Goals / Non-Goals

**Goals:**

- Persist a 1:1 `SpeechPublication` per speech with frozen learner fields and `published` | `unpublished` status.
- Let CMS users publish finished speeches immediately, unpublish live speeches, and unpublish+regenerate in one transaction.
- Expose authenticated learner APIs to list/filter and fetch published snapshots (topic + language).
- Prevent regenerate/delete while a speech is live.

**Non-Goals:**

- Scheduled or delayed publish.
- Publish version history or audit trail beyond `publishedAt`.
- Redis or other read-cache layer.
- Learner browse/playback UI pages (API only).
- Auto-republish after regeneration completes.
- Blocking script edits when a derived speech is published.
- Changing TTS parameters on publish.

## Decisions

### 1. `SpeechPublication` model (1:1 upsert, no delete on unpublish)

Add `SpeechPublication` keyed by unique `speechId`:

| Field         | Type            | Notes                                         |
| ------------- | --------------- | --------------------------------------------- |
| `id`          | cuid            | Primary key                                   |
| `speechId`    | String @unique  | FK → `Speech`, cascade on speech delete       |
| `status`      | String          | `published` \| `unpublished`                  |
| `publishedAt` | DateTime?       | Set to `now()` on every publish/republish     |
| `title`       | String          | From `script.title` at publish time           |
| `content`     | String @db.Text | From `script.content` at publish time         |
| `language`    | String          | From `speech.language`                        |
| `alignment`   | Json            | From `speech.alignment` (required at publish) |
| `r2ObjectKey` | String          | From `speech.r2ObjectKey`                     |
| `voiceName`   | String          | From `voice.name`                             |
| `topicIds`    | String[]        | From `script.topics` at publish time          |

Indexes: `(status)`, `(language)`, GIN on `topicIds` (or equivalent Prisma `@@index` strategy).

**Absence of row** means never published (`not_published` in API responses).

**Unpublish** sets `status = unpublished`; row and snapshot remain.

**Republish** updates the same row: overwrite snapshot fields, `status = published`, `publishedAt = now()`.

**Alternative: JSON snapshot blob** — rejected; explicit columns enable filtering and match existing Prisma style.

**Alternative: delete row on unpublish** — rejected; loses "was published" state and complicates republish UX.

### 2. Snapshot builder helper

Add `src/lib/speech-publication.ts` with:

- `buildPublicationSnapshot(speech with script, voice, topics)` — validates `processStatus === finished`, non-null `alignment`, final audio exists.
- `assertSpeechNotPublished(speechId)` — used by regenerate/delete guards.
- `getPublicationStatus(speechId)` — returns `not_published` \| `published` \| `unpublished`.

Publish loads speech via `findUnique` with `script.topics`, `voice`, and validates before upsert.

### 3. tRPC router `speech-publications`

New `src/trpc/routers/speech-publications.ts`:

| Procedure                | Auth            | Behavior                                                                     |
| ------------------------ | --------------- | ---------------------------------------------------------------------------- |
| `getBySpeechId`          | `cmsProcedure`  | Publication row or `not_published` for CMS detail                            |
| `publish`                | `cmsProcedure`  | Upsert snapshot, `status = published`                                        |
| `unpublish`              | `cmsProcedure`  | `published` → `unpublished`                                                  |
| `unpublishAndRegenerate` | `cmsProcedure`  | Transaction: unpublish (if published) then call shared regenerate reset      |
| `list`                   | `authProcedure` | Published only; optional `language`, `topicId` filters; catalog fields + ids |
| `getById`                | `authProcedure` | Published snapshot by publication `id`; includes resolved `audioUrl`         |

Learner procedures use `authProcedure` (any signed-in user). They MUST NOT expose TTS params, `processStatus`, chunks, or CMS-only fields.

**Alternative: public anonymous catalog** — rejected for v1; app already requires sign-in and `authProcedure` exists.

### 4. Guard `speeches.regenerate` and `speeches.delete`

At the start of both mutations, if publication `status === published`, return `BAD_REQUEST` with a clear message (e.g. "Unpublish this speech before regenerating").

`speeches.getById` adds `publication: { status, publishedAt } | { status: 'not_published' }` and `canRegenerate` already accounts for publish guard (false when published).

### 5. `unpublishAndRegenerate` transaction

Single mutation for the CMS **Unpublish and regenerate** dialog:

1. If `status === published`, set `unpublished`.
2. Run existing regenerate reset (reuse `resetSpeechForTtsRestart` from `src/lib/speech-regenerate.ts`).
3. Enqueue `speech-tts-start`.

If regenerate setup fails after unpublish, the transaction rolls back so the speech does not end up offline with stale live status. Prisma `$transaction` wraps DB steps; storage deletes follow the same ordering as `speeches.regenerate`.

### 6. CMS Publishing card

New components under `src/app/(cms)/cms/speeches/[speechId]/_components/`:

- `speech-publishing-card.tsx` — status badge, copy, action buttons
- `speech-unpublish-and-regenerate-button.tsx` — AlertDialog (mirrors `speech-regenerate-button.tsx`)

Placement: between metadata card and audio preview in `speech-detail.tsx`.

| Publication state | TTS state    | Publishing card                              | Audio Regenerate   |
| ----------------- | ------------ | -------------------------------------------- | ------------------ |
| not_published     | finished     | **Publish**                                  | shown              |
| unpublished       | finished     | **Publish**                                  | shown              |
| published         | finished     | **Unpublish**, **Unpublish and regenerate…** | hidden             |
| any               | not finished | status only; Publish disabled                | per existing rules |

**Delete speech**: disabled (or explanatory dialog) when `published`; same pattern as regenerate.

Metadata card adds **Publication** field alongside process status.

### 7. Learner list filtering

`speech-publications.list` accepts optional `language` (BCP-47 code) and `topicId` (string). Returns rows where `status = published`, matching filters:

- `language` exact match when provided.
- `topicId` ∈ `topicIds` when provided.

Order by `publishedAt` descending. Response shape: `id`, `title`, `language`, `voiceName`, `publishedAt`, `topicIds` (topics can be hydrated in UI later).

## Risks / Trade-offs

- **[Stale snapshot while published]** → Script edits do not affect learners until republish; optional future "script changed since publish" hint, not in v1.
- **[Published audio deleted manually in R2]** → Publish validates object exists; learner `getById` omits URL if missing (same as CMS finished speech pattern).
- **[Race: publish during regenerate]** → Publish requires `finished`; regenerate blocked when published — mutually exclusive.
- **[Multiple speeches per script in catalog]** → Same title may appear with different `voiceName`; acceptable for v1.
- **[topicIds denormalized]** → Topic renames do not affect published cards until republish; matches snapshot model.

## Migration Plan

1. Add `SpeechPublication` table and indexes via Prisma migration.
2. Deploy API router and speech guards.
3. Deploy CMS publishing card.
4. Rollback: remove router/UI; table can remain empty without affecting existing CMS flows.

No backfill — existing speeches start as `not_published`.

## Open Questions

- None for v1. Learner browse UI and public anonymous catalog can be follow-up changes.
