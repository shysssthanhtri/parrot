## Why

Parrot's shadowing pipeline pairs a voice with a script to produce listenable speech audio. Voices, scripts, and the Chatterbox TTS client are in place; we need speeches so the CMS can generate, save, browse, and preview that audio end-to-end.

## What Changes

- Prisma `Speech` model linking a voice, script, language, TTS config, and stored audio object key
- tRPC `speeches` router with `list`, `getById`, `create`, and `generatePreview` (Chatterbox TTS without persisting)
- CMS list page at `/cms/speeches` (table like voices/scripts, row navigation, **New speech** button)
- CMS create page at `/cms/speeches/new`: pick language → select matching voice and script → adjust TTS sliders → generate preview (regeneratable) → save speech
- CMS detail page at `/cms/speeches/[speechId]`: read-only metadata and waveform audio preview
- Speech audio storage via existing storage driver (`local` in dev, `r2` in production)
- Route helpers `SPEECH_NEW` and `SPEECH_DETAIL(id)` in `src/app/configs/routes.ts`

No edit, archive, or delete UI or API in v1. No `createdBy` display in CMS.

## Capabilities

### New Capabilities

- `speeches`: Speech metadata in PostgreSQL, tRPC list/detail/create APIs, Chatterbox preview generation, and audio upload to storage
- `cms-speeches`: Authenticated CMS list, create (`/new`), and read-only detail pages with audio preview

### Modified Capabilities

<!-- none -->

## Impact

- **Code**: `prisma/schema.prisma`, new migration, `src/trpc/routers/speeches.ts`, `src/trpc/routers/_app.ts`, `src/app/(cms)/cms/speeches/`, `src/app/configs/routes.ts`, shared TTS slider config
- **Data**: New `Speech` table with foreign keys to `Voice` and `Script`
- **Dependencies**: Existing Chatterbox client (`src/lib/chatterbox/`), storage helpers (`src/lib/storage/`), wavesurfer preview pattern from voices
- **Systems**: Modal Chatterbox TTS API for generation; local filesystem or Cloudflare R2 for saved speech audio
