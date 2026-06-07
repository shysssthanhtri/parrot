## 1. Dependencies and shared OpenAPI codegen

- [x] 1.1 Add `openapi-fetch` to dependencies and `openapi-typescript` to devDependencies; install with pnpm
- [x] 1.2 Create `openapi/generate.config.json` with the Chatterbox entry (`openapi/chatterbox.openapi.json` → `src/lib/chatterbox/schema.d.ts`)
- [x] 1.3 Create `scripts/generate-openapi.mjs` that reads the config, validates inputs exist, runs `openapi-typescript` per entry, and supports an optional filter arg (e.g. `pnpm generate:api chatterbox`)
- [x] 1.4 Add `generate:api` script to `package.json` pointing at `scripts/generate-openapi.mjs`
- [x] 1.5 Fetch and commit `openapi/chatterbox.openapi.json` from `{CHATTERBOX_API_URL}/openapi.json`
- [x] 1.6 Run `pnpm generate:api` and commit the generated `src/lib/chatterbox/schema.d.ts`

## 2. Environment configuration

- [x] 2.1 Add `CHATTERBOX_API_URL` and `CHATTERBOX_API_KEY` to `src/lib/env.ts` server schema
- [x] 2.2 Document both variables in `.env.example`

## 3. Server-side Chatterbox client module

- [x] 3.1 Create `src/lib/chatterbox/client.ts` with lazy singleton `createChatterboxClient()` using `openapi-fetch`, `env.CHATTERBOX_API_URL`, and `x-api-key` header; mark `server-only`
- [x] 3.2 Create `src/lib/chatterbox/generate.ts` with `generateSpeech()` calling `POST /generate` (`parseAs: "arrayBuffer"`) and returning `Buffer` with error handling for non-200/422 responses
- [x] 3.3 Create `src/lib/chatterbox/index.ts` re-exporting client factory and `generateSpeech`
- [x] 3.4 Export a `TTSRequest` type alias from generated schema for consumers

## 4. Verification

- [x] 4.1 Confirm `pnpm typecheck` passes with the new module
- [x] 4.2 Confirm `pnpm generate:api` regenerates all specs and `pnpm generate:api chatterbox` regenerates only Chatterbox
- [x] 4.3 Manual test: call `generateSpeech` from a temporary script or server route with a known `voice_key` (e.g. `system-voices/andy.wav`) and verify non-empty WAV output
- [x] 4.4 Manual test: confirm invalid/missing API key throws a clear error
