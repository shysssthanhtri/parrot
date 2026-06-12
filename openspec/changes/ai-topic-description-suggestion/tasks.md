## 1. API — topic description suggestion

- [x] 1.1 Add `topics.suggestDescription` mutation in `src/trpc/routers/topics.ts` accepting non-empty `name`, calling `generateText` with a prompt for a 1–2 sentence shadowing-topic description, validating non-empty trimmed output (max ~500 chars), and returning `{ description }` with user-safe errors on failure
- [x] 1.2 Add unit or integration coverage for `suggestDescription` validation (empty name rejected) if the project has existing router test patterns

## 2. CMS — topic form UI

- [x] 2.1 Add **Suggest with AI** button beside the description label in `src/app/(cms)/cms/topics/_components/topic-form.tsx`, wired to `topics.suggestDescription`, disabled when name is empty or pending, populating the description field on success with toast feedback

## 3. Script generation — topic context enrichment

- [x] 3.1 Update `buildScriptGenerationPrompt` in `src/lib/script-generation.ts` to accept topic objects `{ name, description? }` and format prompt lines as `Name: description` when description exists, or name only when absent
- [x] 3.2 Update `scriptGenerations.generate` in `src/trpc/routers/script-generations.ts` to select `{ name, description }` from resolved topics and pass them to `generateScriptDraft`
- [x] 3.3 Update or add tests for prompt building to cover topics with and without descriptions

## 4. Verification

- [x] 4.1 Manually verify: create topic, suggest description from name, save, generate script with that topic attached, confirm prompt context includes description
- [x] 4.2 Run lint and typecheck
