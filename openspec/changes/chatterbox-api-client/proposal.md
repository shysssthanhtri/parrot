## Why

Parrot's Chatterbox TTS service is deployed on Modal with a documented OpenAPI schema, but the Next.js app has no typed client for calling it. Hand-written fetch calls would duplicate request/response shapes, drift from the live API, and miss compile-time safety for the `/generate` endpoint and its `TTSRequest` body. A shared OpenAPI codegen pipeline avoids one-off scripts as more external APIs are added.

## What Changes

- Add **openapi-typescript** and **openapi-fetch** to generate and consume type-safe HTTP clients from OpenAPI documents
- Introduce a **shared OpenAPI codegen pipeline** (`pnpm generate:api`) driven by a config file listing spec → output mappings; Chatterbox is the first entry
- Commit **checked-in OpenAPI snapshots** under `openapi/` (starting with `chatterbox.openapi.json`) so CI and local builds do not depend on external services being up
- Add a **server-only Chatterbox client module** (`src/lib/chatterbox/`) that configures `openapi-fetch` with `CHATTERBOX_API_URL` and `CHATTERBOX_API_KEY` from env
- Register **`CHATTERBOX_API_URL`** and **`CHATTERBOX_API_KEY`** in `src/lib/env.ts` and `.env.example`
- Export typed helpers for **`POST /generate`** (returns `audio/wav` stream or buffer)

## Capabilities

### New Capabilities

- `openapi-codegen`: Config-driven OpenAPI → TypeScript generation for all external API specs
- `chatterbox-api-client`: Env configuration and server-side typed client for the Modal Chatterbox TTS API

### Modified Capabilities

<!-- No existing spec-level behavior changes; this is foundational client infrastructure only -->

## Impact

- **Code**: `package.json` (deps + `generate:api` script), `scripts/generate-openapi.mjs`, `openapi/generate.config.json`, `src/lib/env.ts`, `.env.example`, new `src/lib/chatterbox/` (generated types + client factory), `openapi/chatterbox.openapi.json` snapshot
- **Dependencies**: `openapi-typescript`, `openapi-fetch` (runtime)
- **Environment**: `CHATTERBOX_API_URL`, `CHATTERBOX_API_KEY` required server-side for TTS calls
- **Systems**: Modal Chatterbox TTS API (`POST /generate`, `x-api-key` auth); no CMS UI changes in this change
