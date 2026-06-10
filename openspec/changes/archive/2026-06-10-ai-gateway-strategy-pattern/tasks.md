## 1. Dependencies and environment

- [x] 1.1 Add `ai` (Vercel AI SDK) to `package.json` and install
- [x] 1.2 Add `LLM_PROVIDER` (`vercel-ai-gateway` | `gemini`, default `vercel-ai-gateway`) and `AI_GATEWAY_API_KEY` to `src/lib/env.ts`
- [x] 1.3 Make `GEMINI_API_KEY` conditionally required only when `LLM_PROVIDER=gemini` via Zod superRefine
- [x] 1.4 Update `.env.example` with `LLM_PROVIDER`, `AI_GATEWAY_API_KEY`, and provider selection notes

## 2. LLM provider strategy module

- [x] 2.1 Create `src/lib/llm/types.ts` with `LlmProvider` interface and `GenerateTextResult` type
- [x] 2.2 Create `src/lib/llm/vercel-gateway.ts` strategy using AI SDK `generateText` with model `google/gemini-2.5-flash` and `AI_GATEWAY_API_KEY`
- [x] 2.3 Create `src/lib/llm/gemini.ts` strategy wrapping existing Gemini client (`gemini-2.5-flash`)
- [x] 2.4 Create `src/lib/llm/index.ts` with `getLlmProvider()` factory and `generateText()` convenience export

## 3. Refactor call sites

- [x] 3.1 Refactor `src/lib/script-generation.ts` to use `generateText()` instead of `getGeminiScriptModel()`; export model id from active provider
- [x] 3.2 Refactor `src/trpc/routers/topics.ts` `suggestColor` to use `generateText()` instead of direct Gemini SDK calls
- [x] 3.3 Remove or slim down direct `getGeminiScriptModel` exports from `src/lib/gemini.ts` if no longer imported outside the Gemini strategy

## 4. Verification

- [ ] 4.1 Run `pnpm typecheck` and `pnpm lint` to confirm no type or lint errors
- [ ] 4.2 Manual test with `LLM_PROVIDER=vercel-ai-gateway`: script generation on `/cms/scripts/new` succeeds and persists correct `model` on `ScriptGeneration`
- [ ] 4.3 Manual test with `LLM_PROVIDER=vercel-ai-gateway`: topic color suggestion on `/cms/topics/new` returns a valid hex color
- [ ] 4.4 Manual test with `LLM_PROVIDER=gemini`: both script generation and color suggestion work with `GEMINI_API_KEY` only
- [ ] 4.5 Manual test: env validation fails clearly when the active provider's API key is missing
