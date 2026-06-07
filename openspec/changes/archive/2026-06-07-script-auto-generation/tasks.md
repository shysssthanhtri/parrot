## 1. Database and configuration

- [x] 1.1 Add `ScriptGeneration` model to `prisma/schema.prisma` with relations to `User` and `Script`
- [x] 1.2 Create and apply Prisma migration for `ScriptGeneration`
- [x] 1.3 Add `@google/generative-ai` to `package.json` and install
- [x] 1.4 Add `GEMINI_API_KEY` to `src/lib/env.ts` server schema
- [x] 1.5 Document `GEMINI_API_KEY` in `.env.example` (or project env docs) if present

## 2. Server-side generation and audit

- [x] 2.1 Create `src/lib/script-generation.ts` with length enum, word-count targets, and language-aware prompt builder
- [x] 2.2 Create `src/lib/gemini.ts` server-only client using `GEMINI_API_KEY` and `gemini-2.5-flash`
- [x] 2.3 Implement `generateScriptDraft({ prompt, length, language })` returning parsed `{ title, content }` with error handling for bad JSON or empty fields
- [x] 2.4 Create `src/trpc/routers/script-generations.ts` with `generate` (persist success/failed `ScriptGeneration` row, return `generationId` + draft) and `list` (audit query)
- [x] 2.5 Register `scriptGenerations` router on the app router
- [x] 2.6 Extend `scripts.create` to accept optional `generationId` and set `ScriptGeneration.scriptId` when valid

## 3. CMS UI (create page only)

- [x] 3.1 Create `script-generate-dialog.tsx` with prompt textarea, length select (Short / Medium / Long), Generate and Cancel actions, and loading state
- [x] 3.2 Add **Generate with AI** button to `ScriptForm` when `mode === "create"`; wire dialog open/close
- [x] 3.3 Call `scriptGenerations.generate` with form `language`, dialog `prompt`, and `length`; on success populate `title` and `content`, store `generationId`, and toast success
- [x] 3.4 Pass `generationId` to `scripts.create` on save when present; on generation error, toast error and preserve dialog input; ensure edit mode has no generate control

## 4. Verification

- [ ] 4.1 Manual test: generate Short/Medium/Long drafts in English and at least one other language on `/cms/scripts/new`
- [ ] 4.2 Manual test: save after generate and confirm `ScriptGeneration.scriptId` links to the new script (DB or `scriptGenerations.list`)
- [ ] 4.3 Manual test: failed generation persists a `failed` row (e.g. simulate with invalid API key in dev)
- [ ] 4.4 Manual test: edit generated draft, save, and confirm redirect to script detail
- [ ] 4.5 Manual test: confirm `/cms/scripts/{id}` edit form has no generate control
