## Why

Parrot currently couples all LLM calls directly to Google Gemini (`@google/generative-ai`), which limits flexibility for model selection, observability, and provider fallbacks. [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) provides a unified API to access many models through one endpoint with built-in monitoring and reliability, but we still want to keep Gemini available as a fallback or for local/dev use. A strategy pattern lets us switch the active provider via configuration without rewriting call sites.

## What Changes

- Introduce an `LlmProvider` strategy interface with `generateText(prompt)` as the shared contract
- Implement two strategies: **Vercel AI Gateway** (default) and **Gemini** (retained)
- Add `LLM_PROVIDER` env var (`vercel-ai-gateway` | `gemini`) to select the active strategy at runtime
- Add `AI_GATEWAY_API_KEY` env var; make `GEMINI_API_KEY` required only when `LLM_PROVIDER=gemini`
- Refactor `generateScriptDraft` and `topics.suggestColor` to use the provider abstraction instead of calling Gemini directly
- Persist the resolved model identifier on `ScriptGeneration` rows regardless of which provider is active
- Update `.env.example` with new variables and provider selection docs

## Capabilities

### New Capabilities

- `llm-provider`: Pluggable LLM provider strategy with Vercel AI Gateway and Gemini implementations, env-based selection, and a shared `generateText` contract

### Modified Capabilities

- `script-generation`: Replace hard-coded "call Google Gemini" requirement with provider-agnostic LLM invocation via the strategy; failure scenarios reference the active provider generically
- `script-topics`: Replace hard-coded Gemini requirement in `topics.suggestColor` with provider-agnostic LLM invocation

## Impact

- **Code**: `src/lib/gemini.ts`, new `src/lib/llm/` module (strategy interface + implementations), `src/lib/script-generation.ts`, `src/lib/env.ts`, `src/trpc/routers/topics.ts`
- **Dependencies**: Add `ai` SDK (Vercel AI SDK) for Gateway integration; retain `@google/generative-ai`
- **Environment**: New `AI_GATEWAY_API_KEY`, `LLM_PROVIDER`; conditional validation for `GEMINI_API_KEY`
- **Specs**: No user-facing API or UI changes; tRPC contracts unchanged
