## 1. API — topic description suggestion

- [x] 1.1 Add `topics.suggestDescription` mutation in `src/trpc/routers/topics.ts` accepting non-empty `name`, calling `generateText` with a prompt for a 1–2 sentence shadowing-topic description, validating non-empty trimmed output (max ~500 chars), and returning `{ description }` with user-safe errors on failure

## 2. CMS — topic form UI

- [x] 2.1 Add **Suggest with AI** button beside the description label in `src/app/(cms)/cms/topics/_components/topic-form.tsx`, wired to `topics.suggestDescription`, disabled when name is empty or pending, populating the description field on success with toast feedback

## 3. Script generation — topic context enrichment

- [x] 3.1 Update `buildScriptGenerationPrompt` in `src/lib/script-generation.ts` to accept topic objects `{ name, description? }` and format prompt lines as `Name: description` when description exists, or name only when absent
- [x] 3.2 Update `scriptGenerations.generate` in `src/trpc/routers/script-generations.ts` to select `{ name, description }` from resolved topics and pass them to `generateScriptDraft`

## 4. Verification

- [x] 4.2 Run lint and typecheck
