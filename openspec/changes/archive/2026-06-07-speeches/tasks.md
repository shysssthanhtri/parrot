## 1. Database

- [x] 1.1 Add `Speech` model to `prisma/schema.prisma` with voice/script FKs, language, TTS params, `r2ObjectKey`, required `userId` FK to `User`, timestamps; add relations on `User`, `Voice`, and `Script`
- [x] 1.2 Create and apply migration for `Speech`

## 2. Shared TTS config

- [x] 2.1 Create `src/lib/speech-sliders.ts` with slider definitions (temperature, topP, topK, repetitionPenalty) matching Resonance defaults and bounds, plus default `normLoudness` and a `description` tooltip string for each control

## 3. tRPC speeches API

- [x] 3.1 Implement Zod schemas for TTS params and speech inputs in `src/trpc/routers/speeches.ts`
- [x] 3.2 Implement shared validation helper: load voice/script, enforce language match, require voice `r2ObjectKey`
- [x] 3.3 Implement `speeches.list` with voice name and script title includes
- [x] 3.4 Implement `speeches.getById` with relations and resolved `audioUrl` via `getAudioUrl`
- [x] 3.5 Implement `speeches.generatePreview` calling `generateSpeech` and returning base64 WAV
- [x] 3.6 Implement `speeches.create`: generate audio, upload to `speeches/{id}.wav` via `uploadObject`, persist row with `userId` from session
- [x] 3.7 Mount `speechesRouter` on `src/trpc/routers/_app.ts`

## 4. Routes

- [x] 4.1 Add `SPEECH_NEW` and `SPEECH_DETAIL(id)` to `src/app/configs/routes.ts`

## 5. CMS list page

- [x] 5.1 Create `src/app/(cms)/cms/speeches/page.tsx` with server fetch via tRPC caller
- [x] 5.2 Create `speeches-table.tsx`: columns script title, voice name, language label, updated; row click → detail; empty state
- [x] 5.3 Add **New speech** button linking to `/cms/speeches/new`
- [x] 5.4 Add `loading.tsx` with table skeleton matching list columns

## 6. CMS create page

- [x] 6.1 Create `speech-create-form.tsx`: language select, filtered voice/script pickers, TTS sliders + norm loudness toggle, each with a shadcn tooltip showing the shared `description` copy
- [x] 6.2 Wire **Generate** / **Regenerate** to `speeches.generatePreview` with loading state and inline waveform preview (data URL from base64)
- [x] 6.3 Wire **Save** to `speeches.create`; on success redirect to `SPEECH_DETAIL(id)`; require successful preview before save
- [x] 6.4 Create `src/app/(cms)/cms/speeches/new/page.tsx` hosting the create form

## 7. CMS detail page

- [x] 7.1 Create `src/app/(cms)/cms/speeches/[speechId]/page.tsx` loading speech via tRPC caller
- [x] 7.2 Create read-only detail layout with metadata and waveform preview (reuse or extract shared audio preview component)
- [x] 7.3 Add `not-found.tsx` for missing speech id

## 8. Verification

- [x] 8.2 Run `pnpm lint` and `pnpm typecheck`
