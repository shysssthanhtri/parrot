## Context

Chatterbox TTS runs on Modal (`modal/chatterbox_tts.py`) and exposes a FastAPI app with OpenAPI at `/openapi.json`. The live spec documents a single authenticated endpoint:

- `POST /generate` — accepts `TTSRequest` JSON (`prompt`, `voice_key`, optional sampling params), returns `audio/wav`
- Security: `x-api-key` header (`ApiKeyAuth`)

The Next.js app already uses `@t3-oss/env-nextjs` for server env validation (`src/lib/env.ts`) and `server-only` modules for secrets (e.g. `src/lib/gemini.ts`). There is no existing HTTP client for Chatterbox; future TTS features (script audio preview, voice samples) will need one. Parrot may integrate additional OpenAPI-described services later, so codegen should not be Chatterbox-specific.

Local `.env` already defines `CHATTERBOX_API_URL`; `CHATTERBOX_API_KEY` is synced to Modal via GitHub Actions.

## Goals / Non-Goals

**Goals:**

- Provide a **shared** OpenAPI → TypeScript pipeline usable by any future external API
- Generate types with **openapi-typescript** and consume them via **openapi-fetch**
- Keep generation **reproducible offline** via committed snapshots under `openapi/`
- Add Chatterbox as the **first configured spec**; adding another API is a config + snapshot change only
- Centralize Chatterbox config in `env` (`CHATTERBOX_API_URL`, `CHATTERBOX_API_KEY`)
- Provide a thin server-only `generateSpeech` helper for `POST /generate`

**Non-Goals:**

- CMS UI or tRPC routes that call TTS (follow-up changes)
- Client-side/browser access to Chatterbox (API key must stay server-side)
- Caching, retries, or queueing of TTS jobs
- Checking OpenAPI drift in CI (optional follow-up)
- Replacing or modifying the Modal FastAPI service
- Generating runtime client wrappers automatically (only types are codegen'd; hand-written client modules per API)

## Decisions

### Shared codegen: config + script

A single npm script generates types for **all** registered OpenAPI specs:

```json
"generate:api": "node scripts/generate-openapi.mjs"
```

Config at `openapi/generate.config.json` — array of `{ "input", "output" }` pairs:

```json
[
  {
    "input": "openapi/chatterbox.openapi.json",
    "output": "src/lib/chatterbox/schema.d.ts"
  }
]
```

`scripts/generate-openapi.mjs` reads the config and runs `openapi-typescript` for each entry. Optional CLI filter for one spec:

```bash
pnpm generate:api              # all specs
pnpm generate:api chatterbox   # only chatterbox (matched by input filename stem)
```

**Alternative:** Per-API npm scripts (`generate:chatterbox-api`, …) — rejected; does not scale and duplicates tooling.

**Alternative:** Fetch from live URL on every generate — rejected; brittle for CI and offline dev.

**Alternative:** Hand-written types — rejected; duplicates OpenAPI and will drift.

### OpenAPI snapshot layout

```
openapi/
  generate.config.json       # spec → output mappings
  chatterbox.openapi.json    # committed snapshot (first API)
  <future>.openapi.json      # add alongside a new config entry
```

Snapshots are fetched manually from live services when the upstream API changes — not at generate time.

### Package placement

| Package              | Kind          | Role                                  |
| -------------------- | ------------- | ------------------------------------- |
| `openapi-fetch`      | dependency    | Runtime typed fetch client            |
| `openapi-typescript` | devDependency | CLI invoked by `generate-openapi.mjs` |

Generated `schema.d.ts` files are committed (same pattern as Prisma client output) so `tsc` and CI work without running generate first.

### Adding a future API

1. Add `openapi/<name>.openapi.json` snapshot
2. Add `{ "input": "openapi/<name>.openapi.json", "output": "src/lib/<name>/schema.d.ts" }` to config
3. Run `pnpm generate:api`
4. Hand-write a server-only client module in `src/lib/<name>/` (env, auth, helpers)

No changes to the generate script itself.

### Chatterbox module layout (`src/lib/chatterbox/`)

```
src/lib/chatterbox/
  schema.d.ts      # generated — do not edit
  client.ts        # createChatterboxClient() — openapi-fetch + auth header
  generate.ts      # generateSpeech() — POST /generate → Buffer
  index.ts         # re-exports for server consumers
```

All modules import `server-only` at the top.

### Client factory

```ts
import createClient from "openapi-fetch";
import type { paths } from "./schema";

export function createChatterboxClient() {
  return createClient<paths>({
    baseUrl: env.CHATTERBOX_API_URL,
    headers: { "x-api-key": env.CHATTERBOX_API_KEY },
  });
}
```

Singleton vs factory: use a **lazy singleton** (like `gemini.ts`) to avoid re-creating the client per call.

### `generateSpeech` helper

Wrap `client.POST("/generate", { body, parseAs: "arrayBuffer" })`:

- Input: `components["schemas"]["TTSRequest"]` (or a narrowed type alias)
- Output: `Buffer` from response `data` on 200
- Errors: if `error` is set or status ≠ 200, throw `Error` with status and serialized `error` detail

The OpenAPI spec lists both `application/json` and `audio/wav` for 200; `parseAs: "arrayBuffer"` targets the WAV body explicitly.

### Environment variables

Add to `src/lib/env.ts` `server` schema:

```ts
CHATTERBOX_API_URL: z.string().url(),
CHATTERBOX_API_KEY: z.string().min(1),
```

Document both in `.env.example`. `CHATTERBOX_API_URL` should be the Modal serve base (no trailing slash), e.g. `https://…--parrot-chatterbox-tts-chatterbox-serve.modal.run`.

### Updating a snapshot

When an upstream API changes, refresh its snapshot and regenerate all (or one):

```bash
curl -s "$CHATTERBOX_API_URL/openapi.json" -o openapi/chatterbox.openapi.json
pnpm generate:api chatterbox
```

## Risks / Trade-offs

| Risk                                                | Mitigation                                                   |
| --------------------------------------------------- | ------------------------------------------------------------ |
| OpenAPI snapshot drifts from deployed API           | Document refresh steps per API; regenerate after deploys     |
| Generated file noise in diffs                       | Acceptable; only changes when API changes                    |
| `audio/wav` response typing may be loose in OpenAPI | Use `parseAs: "arrayBuffer"` and runtime status check        |
| API key in server env only                          | `server-only` import guard; never expose via tRPC inputs     |
| Config and snapshots get out of sync                | Generate script validates config inputs exist before running |

## Migration Plan

1. Add env vars to `.env` / deployment secrets (URL likely already set; add key if missing)
2. Add codegen pipeline, commit Chatterbox snapshot, run `pnpm generate:api`, add client module
3. No DB migration; no feature flags required
4. Rollback: remove module and env vars; no runtime impact until a consumer imports the client

## Open Questions

- None for v1 — tRPC integration and CMS audio preview are separate changes.
