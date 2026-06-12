## Why

Finished speeches in the CMS are authoring artifacts tied to live scripts, TTS processing state, and mutable audio. Learners need a stable, read-optimized snapshot for shadowing (script text, alignment, audio, topics, language), while authors need publish/unpublish controls without risking broken live content during regeneration. Publishing is the bridge from the topics → scripts → speeches pipeline to the end-user shadowing experience.

## What Changes

- Add a `SpeechPublication` Prisma model (1:1 with `Speech`) that stores a frozen learner snapshot and publication status (`published` | `unpublished`).
- Add CMS tRPC mutations: `publish`, `unpublish`, and `unpublishAndRegenerate` (atomic unpublish + regenerate).
- Add learner tRPC queries to list and fetch published speeches, filterable by language and topic.
- On **publish** (or republish): upsert the publication row, overwrite snapshot fields from the current script/speech/voice/topics, set `status = published`, and set `publishedAt` to now.
- On **unpublish**: update `status = unpublished`; keep the row and snapshot.
- Block `speeches.regenerate` and `speeches.delete` when the speech has `status = published`.
- Add a **Publishing** card on the CMS speech detail page with publish/unpublish actions and gated regenerate UX.

## Capabilities

### New Capabilities

- `speech-publications`: `SpeechPublication` model, snapshot-on-publish semantics, CMS publish/unpublish/unpublishAndRegenerate APIs, and learner list/detail APIs over published snapshots only.
- `cms-speech-publishing`: Publishing card and controls on the speech detail page, including publication status in metadata and regenerate/delete gating when live.

### Modified Capabilities

- `speeches`: Reject regenerate and delete when publication status is `published`; expose publication summary on `getById`.
- `cms-speeches`: Integrate publication status into speech detail metadata and wire publishing/regenerate/delete guard UX.

## Impact

- **Database**: Prisma migration adding `SpeechPublication` with snapshot fields and indexes on `status`, `language`, and `topicIds`.
- **API**: New `src/trpc/routers/speech-publications.ts`; updates to `src/trpc/routers/speeches.ts` and `src/trpc/routers/_app.ts`.
- **Lib**: Shared helpers for building publication snapshots and checking publish guards (e.g. `src/lib/speech-publication.ts`).
- **CMS UI**: `speech-detail.tsx`, `speech-detail-client.tsx`, new publishing card/button components under `src/app/(cms)/cms/speeches/[speechId]/_components/`.
- **Consumer API**: Authenticated learner queries (no CMS role required); no learner browse UI in this change.
- **Storage**: No new buckets; published audio references the same `r2ObjectKey` as the authoring speech.
- **Background jobs**: None (scheduled publish explicitly out of scope).
