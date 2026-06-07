## Context

The CMS new-script page (`/cms/scripts/new`) uses a shared `ScriptForm` with `title`, `content`, and `language` fields. Authors type content manually. Parrot has no existing LLM integration; auth is via NextAuth with tRPC `authProcedure` on all script routes.

Scripts are shadowing practice material — generated text should be natural spoken prose at a target duration, in the script's selected language.

## Goals / Non-Goals

**Goals:**

- Add **Generate with AI** on the create-script form only
- Let authors choose length (**Short** ~30s, **Medium** ~1m, **Long** ~5m) and enter a content prompt
- Use the form's current `language` when generating
- Return draft `title` and `content` from Gemini; populate form fields for review before save
- **Persist every generation attempt** for audit (inputs, outputs, success/failure, user, timestamp)
- Link saved scripts back to the generation that produced the draft when applicable
- Keep API key server-side; expose generation only to authenticated CMS users

**Non-Goals:**

- CMS UI to browse generation history in v1 (`scriptGenerations.list` is API-only for audit)
- Auto-generate on the edit/detail page in v1
- Streaming partial results to the UI
- Auto-saving generated scripts without user confirmation
- Generating audio or pairing with voices
- Rate limiting / usage quotas beyond basic error handling

## Decisions

### `ScriptGeneration` Prisma model

New model `ScriptGeneration` (table `ScriptGeneration`):

| Field              | Type             | Notes                                                  |
| ------------------ | ---------------- | ------------------------------------------------------ |
| `id`               | String (cuid)    | Primary key; returned to client as `generationId`      |
| `prompt`           | String @db.Text  | User's content prompt                                  |
| `length`           | String           | `short`, `medium`, or `long`                           |
| `language`         | String           | BCP-47 code (same set as Script)                       |
| `generatedTitle`   | String?          | Set on success                                         |
| `generatedContent` | String? @db.Text | Set on success                                         |
| `status`           | String           | `success` or `failed`                                  |
| `errorMessage`     | String?          | Set on failure (user-safe summary)                     |
| `model`            | String           | e.g. `gemini-2.5-flash`                                |
| `userId`           | String?          | Requesting CMS user                                    |
| `scriptId`         | String?          | Set when user saves a script linked to this generation |
| `createdAt`        | DateTime         | Immutable audit timestamp                              |

Relations: optional `user` → `User`, optional `script` → `Script` (one-to-one from generation side; a script may omit a generation link).

**Alternative:** Embed generation metadata on `Script` — rejected; many generations never become scripts and failed attempts must be retained.

### Persist on every attempt

`scriptGenerations.generate` always writes a row:

- **Success:** `status = success`, store `generatedTitle` and `generatedContent`
- **Failure** (Gemini error, bad JSON, empty fields): `status = failed`, store `errorMessage`, return error to client

Creates audit trail even when the user never saves a script.

### Gemini SDK and model

Use `@google/generative-ai` with `gemini-2.5-flash`. Server-only client in `src/lib/gemini.ts` reading `GEMINI_API_KEY` from `env`. Store model name on each `ScriptGeneration` row.

### Length enum

`ScriptGenerationLength`: `short | medium | long` with approximate word targets (~75 / ~150 / ~750 words at ~150 wpm). Word counts are prompt guidance, not hard server truncation.

### tRPC `scriptGenerations` router

New router (registered on app router as `scriptGenerations`):

**`generate`** mutation:

```ts
input: {
  (prompt, length, language);
}
output: {
  (generationId, title, content);
}
```

Flow: validate → call Gemini → persist `ScriptGeneration` → return ids and draft on success; persist failed row then throw on failure.

**`list`** query:

```ts
output: ScriptGeneration[] // ordered by createdAt desc
```

Authenticated; returns all generation rows (v1: no pagination). No CMS page in v1 — for audit/debug via API or future admin UI.

### Link generation to saved script

`scripts.create` accepts optional `generationId`:

- Generation must exist, belong to `ctx.userId`, have `status = success`, and `scriptId` must be null
- On successful script create, set `ScriptGeneration.scriptId` to the new script's id
- Invalid or already-linked `generationId` → validation error

Client holds `generationId` in form state after generate; passes it on create. If user edits heavily or generates again, the latest `generationId` wins.

**Alternative:** Auto-create script on generate — rejected; user must confirm save.

### CMS UI: dialog on create form

Unchanged from prior design: **Generate with AI** opens dialog with prompt + length; on success populate `title`, `content`, and store `generationId` in component state for create submit.

### Script draft not auto-persisted

`Script` row is created only on explicit save. `ScriptGeneration` holds the AI draft separately for audit.

## Risks / Trade-offs

| Risk                            | Mitigation                                                                             |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| Gemini returns invalid JSON     | Prompt requests JSON only; persist failed row with error message                       |
| Table growth from unused drafts | Acceptable for v1 CMS volume; list API supports audit; retention policy is a follow-up |
| Stale `generationId` on save    | Validate ownership and unlinked state; clear client state on re-generate               |
| API latency (5–15s)             | Loading state on dialog; disable double-submit                                         |
| Key exposure                    | Server-only module; never pass key to client                                           |

## Migration Plan

1. Add `ScriptGeneration` model and run Prisma migration
2. Add `GEMINI_API_KEY` to deployment env and local `.env`
3. Install `@google/generative-ai`, ship server module + routers + UI

Rollback: remove UI and routes; `ScriptGeneration` table can remain for audit data.

## Open Questions

- None for v1 — retention policy and audit UI deferred.
