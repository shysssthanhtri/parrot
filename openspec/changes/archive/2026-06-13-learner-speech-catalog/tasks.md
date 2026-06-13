## 1. Database and publication snapshot

- [x] 1.1 Add `length String @default("medium")` to `SpeechPublication` in `prisma/schema.prisma` and run migration
- [x] 1.2 Extend `SpeechForPublicationSnapshot` and `PublicationSnapshot` in `src/lib/speech-publication.ts` to include `length` from `speech.script.length`
- [x] 1.3 Include `length` in `speechForPublishInclude` / `loadSpeechForPublish` script select in `src/trpc/routers/speech-publications.ts`

## 2. Learner list API

- [x] 2.1 Add `length` to the `select` and return shape of `speechPublications.list` in `src/trpc/routers/speech-publications.ts`

## 3. Learner catalog UI

- [x] 3.1 Create `LearnerSpeechCard` in `src/app/learn/_components/learner-speech-card.tsx` — portrait thumbnail, title, length label (`getScriptLengthLabel`), language label (`getScriptLanguageLabel`), voice name; thumbnail fallback when `thumbnailUrl` is null
- [x] 3.2 Create `LearnerSpeechCatalog` client component in `src/app/learn/_components/learner-speech-catalog.tsx` — fetch `speechPublications.list` via TanStack Query + tRPC; track `focusedIndex`; render one card; ArrowUp/ArrowDown with clamp (no wrap); position indicator (e.g. 2 / 5); loading skeleton
- [x] 3.3 Replace coming-soon content in `src/app/learn/page.tsx` with `LearnerSpeechCatalog` and an empty state when the list is empty (shadcn `Empty`, no "coming soon" copy)

## 4. Quality

- [x] 4.1 Run lint, typecheck, and build
