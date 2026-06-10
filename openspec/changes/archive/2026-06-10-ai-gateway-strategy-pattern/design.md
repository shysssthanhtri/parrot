## Context

Parrot uses Google Gemini for two server-side LLM tasks:

1. **Script generation** (`src/lib/script-generation.ts`) — structured JSON draft via `getGeminiScriptModel()`
2. **Topic color suggestion** (`src/trpc/routers/topics.ts`) — hex color from topic name via `getGeminiScriptModel()`

Both call sites import `src/lib/gemini.ts` directly, which instantiates `@google/generative-ai` with a hard-coded `GEMINI_API_KEY`. The existing `script-generation` and `script-topics` specs require Gemini by name.

[Vercel AI Gateway](https://vercel.com/docs/ai-gateway) offers a unified OpenAI-compatible API (`https://ai-gateway.vercel.sh/v1`) and works with the Vercel AI SDK (`ai` package). We want Gateway as the default while keeping Gemini callable for dev, migration, or direct-provider preference.

## Goals / Non-Goals

**Goals:**

- Introduce a strategy-pattern LLM abstraction with a single `generateText` entry point
- Implement Vercel AI Gateway (default) and Gemini (retained) strategies
- Select provider via `LLM_PROVIDER` env var without code changes
- Refactor existing call sites to use the abstraction; no tRPC or UI contract changes
- Persist the resolved `modelId` on `ScriptGeneration` rows from whichever provider is active

**Non-Goals:**

- Runtime provider switching per request (env-only selection)
- Provider fallback chains within a single request (Gateway handles its own retries)
- Streaming responses
- Per-feature model configuration (one default model per provider for now)
- Removing `@google/generative-ai` or `src/lib/gemini.ts` (Gemini strategy reuses them)
- CMS UI for provider selection

## Decisions

### Strategy interface in `src/lib/llm/`

```
src/lib/llm/
  types.ts          # LlmProvider interface, GenerateTextResult
  index.ts          # getLlmProvider() factory, generateText() convenience
  vercel-gateway.ts # Vercel AI Gateway strategy
  gemini.ts         # Gemini strategy (wraps existing gemini.ts client)
```

**Interface:**

```ts
type GenerateTextResult = { text: string; modelId: string };

interface LlmProvider {
  readonly providerId: "vercel-ai-gateway" | "gemini";
  generateText(prompt: string): Promise<GenerateTextResult>;
}
```

`getLlmProvider()` reads `env.LLM_PROVIDER` once (module-level singleton) and returns the matching strategy. `generateText()` delegates to the singleton.

**Alternative:** Inject provider via DI in tRPC context — rejected; only two call sites, env-based singleton is simpler and matches server-only usage.

### Vercel AI Gateway via AI SDK

Use the `ai` package with `generateText`:

```ts
import { generateText } from "ai";

const { text } = await generateText({
  model: "google/gemini-2.5-flash", // Gateway model slug
  prompt,
});
```

Configure Gateway auth by setting the AI SDK provider base URL and API key (via `AI_GATEWAY_API_KEY`). Default model: `google/gemini-2.5-flash` — same model family as current Gemini direct integration, routed through Gateway.

**Alternative:** Raw `fetch` to OpenAI-compatible `/v1/chat/completions` — rejected; AI SDK is the documented integration path and keeps the code minimal.

### Gemini strategy wraps existing module

Move direct SDK usage into `src/lib/llm/gemini.ts` (strategy). The current `src/lib/gemini.ts` can either be inlined into the strategy or kept as a thin client helper imported by the strategy. Model remains `gemini-2.5-flash`; `modelId` returned as `gemini-2.5-flash`.

### Environment variables

| Variable             | Required when                               | Default             |
| -------------------- | ------------------------------------------- | ------------------- |
| `LLM_PROVIDER`       | always optional                             | `vercel-ai-gateway` |
| `AI_GATEWAY_API_KEY` | `LLM_PROVIDER=vercel-ai-gateway` (or unset) | —                   |
| `GEMINI_API_KEY`     | `LLM_PROVIDER=gemini`                       | —                   |

Use Zod `.superRefine()` in `src/lib/env.ts` for conditional key validation (same pattern as optional R2 vars). Remove the unconditional `GEMINI_API_KEY` requirement.

### Call site refactors

**`script-generation.ts`:** Replace `getGeminiScriptModel()` + `model.generateContent()` with `generateText(prompt)`. Use returned `modelId` for `SCRIPT_GENERATION_MODEL` export and persistence. Rename export to `SCRIPT_GENERATION_MODEL` sourced from active provider's default model constant.

**`topics.ts`:** Replace `getGeminiScriptModel()` with `generateText(prompt)` in `suggestColor`.

### Dependencies

- Add `ai` (Vercel AI SDK) for Gateway integration
- Keep `@google/generative-ai` for Gemini strategy

## Risks / Trade-offs

| Risk                                               | Mitigation                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Gateway model slug differs from direct Gemini name | Use `google/gemini-2.5-flash` per Gateway docs; persist whatever `modelId` the provider returns |
| Conditional env validation complexity              | Zod superRefine with clear error messages per provider                                          |
| Two code paths to maintain                         | Shared `generateText` contract; strategies are small (~20 lines each)                           |
| Existing deployments missing `AI_GATEWAY_API_KEY`  | Document in `.env.example`; migration plan sets new key before switching default                |
| Gateway latency vs direct Gemini                   | Acceptable trade-off for unified monitoring; can set `LLM_PROVIDER=gemini` to bypass            |

## Migration Plan

1. Add `ai` dependency and `src/lib/llm/` module with both strategies
2. Update `env.ts` with `LLM_PROVIDER`, `AI_GATEWAY_API_KEY`, conditional `GEMINI_API_KEY`
3. Refactor call sites to use `generateText`
4. Update `.env.example` — add Gateway vars, note provider selection
5. Deploy: set `AI_GATEWAY_API_KEY` in production; `LLM_PROVIDER` can remain unset (defaults to Gateway)
6. Local dev: developers can use `LLM_PROVIDER=gemini` + existing `GEMINI_API_KEY` if Gateway key unavailable

**Rollback:** Set `LLM_PROVIDER=gemini` and ensure `GEMINI_API_KEY` is set. No schema migration required.

## Open Questions

- None for v1 — per-feature model overrides and Gateway fallback configuration deferred to Gateway dashboard / future work.
