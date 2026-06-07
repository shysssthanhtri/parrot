## Why

Creating script content from scratch is slow and repetitive for CMS authors. Auto-generating draft text from a short prompt lets authors start with usable content tuned to target length and language, then edit before saving. Persisting each generation supports audit, debugging, and tracing which AI drafts became saved scripts.

## What Changes

- Add a **Generate with AI** flow on the new-script page (`/cms/scripts/new`) that opens a dialog for prompt and length selection
- Support three target lengths: **Short** (~30 seconds), **Medium** (~1 minute), and **Long** (~5 minutes) of spoken content
- Call Google Gemini server-side to produce draft `title` and `content` from the user's prompt, selected length, and form's current language
- **Persist every generation attempt** in a new `ScriptGeneration` model (inputs, outputs, status, user, optional link to saved script)
- Populate the create form fields with the generated draft; user reviews and saves manually
- On script create, optionally link the saved script back to the generation record that produced the draft
- Add `GEMINI_API_KEY` server environment variable and `@google/generative-ai` dependency
- Expose a new `scriptGenerations` tRPC router with `generate` and `list` (create page uses `generate` in v1; no CMS audit UI in v1)

## Capabilities

### New Capabilities

- `script-generation`: Prisma `ScriptGeneration` model, persistence on each generate attempt, `scriptGenerations.generate` and `scriptGenerations.list` APIs

### Modified Capabilities

- `scripts`: `scripts.create` accepts optional `generationId` to link a saved script to its source generation
- `cms-scripts`: New-script page adds auto-generate control; form passes `generationId` on save when the draft came from AI generation

## Impact

- **Code**: `prisma/schema.prisma`, new migration, `src/lib/env.ts`, Gemini client module, `src/trpc/routers/script-generations.ts`, `src/trpc/routers/scripts.ts`, `src/app/(cms)/cms/scripts/_components/script-form.tsx` (create mode), new dialog component
- **Dependencies**: `@google/generative-ai`
- **Environment**: `GEMINI_API_KEY` required in server env for generation to work
- **Data**: New `ScriptGeneration` table; no changes to existing `Script` rows
- **Systems**: External call to Google Gemini API on each generate request; authenticated CMS users only
