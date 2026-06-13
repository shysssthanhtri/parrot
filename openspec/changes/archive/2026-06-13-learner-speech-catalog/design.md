## Context

The learner space at `/learn` is auth-gated with a dedicated header (`src/app/learn/layout.tsx`, `LearnHeader`). The page currently shows welcome copy and a "Speech catalog coming soon" empty state (`src/app/learn/page.tsx`).

Backend support for browsing already exists:

- `speechPublications.list` returns published rows with `title`, `language`, `voiceName`, `topicIds`, `publishedAt`, and resolved `thumbnailUrl` (832×1088 portrait images).
- Thumbnails and publication snapshots were added in prior changes; learner catalog UI was explicitly deferred.

Script `length` (`short`, `medium`, `long`) lives on `Script` but is not frozen in `SpeechPublication`. Learner cards need the length label at publish time, consistent with other snapshot fields.

## Goals / Non-Goals

**Goals:**

- Add `length` to `SpeechPublication` and include it in publish snapshot and `speechPublications.list`.
- Replace `/learn` coming-soon with a browse-only vertical card carousel (one card visible).
- Show thumbnail, title, length label, language label, and voice name per card.
- Support ArrowUp / ArrowDown keyboard navigation with position indicator; stop at first/last (no wrap).
- Show a real empty state when the catalog is empty.

**Non-Goals:**

- Start button, audio playback, player overlay, or `getById` prefetch for play.
- Language/topic filter UI, mobile swipe, separate `/learn/[id]` route.
- Topic names on cards (only `topicIds` in API today).
- Backfilling `length` on existing publication rows without republish (migration default handles new column; existing rows get a sensible default until republished).

## Decisions

### Freeze `length` in publication snapshot

Add non-null `length String` on `SpeechPublication` (default `medium` for migration). Include `script.length` in `buildPublicationSnapshot` (`src/lib/speech-publication.ts`) and extend `SpeechForPublicationSnapshot` to select script length.

**Alternative:** Join `Script` at list query time — rejected; breaks snapshot immutability if authors edit scripts after publish.

### Client carousel on `/learn`

Use a client component (e.g. `LearnerSpeechCatalog`) mounted from the server page. Fetch via TanStack Query + tRPC `speechPublications.list`, mirroring CMS client patterns (`speech-detail-client.tsx`).

State: `focusedIndex` (default `0`). Render only `speeches[focusedIndex]`. Global `keydown` listener for ArrowUp (−1, clamp at 0) and ArrowDown (+1, clamp at length − 1).

**Alternative:** Scrollable list with focus ring — rejected; product decision is one visible Shorts-style card.

### Card layout and thumbnail aspect

Scale the card to available viewport height below `LearnHeader`. Display thumbnail at native ~3:4 aspect (832×1088) with `object-cover` inside a rounded container; metadata below. Reuse `getScriptLengthLabel` and `getScriptLanguageLabel` from existing lib modules for display labels.

**Alternative:** Crop to 9:16 — rejected for v1; thumbnails are 3:4 and cropping may clip generated art.

### Empty and loading states

- **Loading:** skeleton or spinner centered in catalog area.
- **Empty:** shadcn `Empty` component with copy indicating no published speeches yet (not "coming soon").
- **Missing thumbnail:** placeholder block or muted fallback when `thumbnailUrl` is null.

### No Start affordance

Do not render a Start button or other play CTA until a follow-up player change ships.

## Risks / Trade-offs

- **[Existing publications lack accurate length until republish]** → Migration defaults `length` to `medium`; republish refreshes snapshot. Acceptable for early catalog.
- **[Keyboard nav conflicts with page scroll]** → Catalog area uses fixed layout; prevent default on arrow keys when catalog is focused/mounted.
- **[Large thumbnail images]** → Next.js `Image` with appropriate sizing; list already returns presigned URLs.

## Migration Plan

1. Prisma migration: add `length String @default("medium")` to `SpeechPublication`.
2. Deploy API + snapshot changes; republish speeches as needed for accurate length labels.
3. Deploy learner UI replacing coming-soon state.
4. Rollback: revert UI only; new column is backward-compatible.

## Open Questions

None — browse-only scope and no Start button are confirmed.
