## Context

Topics are managed in the CMS with name, optional description, and color. The topic form already offers **Suggest with AI** for color via `topics.suggestColor`, which calls the shared LLM provider through `generateText`. Script generation accepts optional `topicIds` and currently loads only topic **names** into the prompt (`Related topics: Travel, Food`). Descriptions are stored but never used during generation, so authors who skip writing one lose topical context entirely.

## Goals / Non-Goals

**Goals:**

- Let CMS users generate a concise, useful topic description from a topic name with one click.
- Reuse the existing LLM provider strategy and the same UX pattern as color suggestion.
- Pass topic descriptions into script generation prompts when topics are selected and descriptions exist, improving draft relevance.

**Non-Goals:**

- Auto-generating descriptions on topic save without user action.
- Changing the Topic database schema (description field already exists).
- Regenerating descriptions when the topic name changes automatically.
- Localizing suggested descriptions into multiple languages.

## Decisions

### 1. New `topics.suggestDescription` mutation (mirror `suggestColor`)

Add a tRPC mutation accepting `name` (required, non-empty) that returns `{ description: string }`. The server builds a short prompt asking the LLM for a 1–2 sentence description suitable for guiding shadowing script content about that topic. Trim and validate non-empty output; on failure, return a user-safe error like color suggestion does.

**Alternative considered:** Client-side placeholder text only — rejected because it does not improve script generation quality.

### 2. Topic form UI matches color suggestion pattern

Place a **Suggest with AI** button beside the description label. Disable when name is empty or request is pending. On success, populate the description textarea (user can edit before save). Show toast on success/error. Works on both create and edit forms via the shared `TopicForm` component.

**Alternative considered:** Auto-fill on name blur — rejected to avoid unexpected LLM calls and cost.

### 3. Extend script generation prompt with topic name + description pairs

Change `buildScriptGenerationPrompt` to accept `topics?: { name: string; description?: string | null }[]` instead of bare `topicNames`. Format each topic as `Name: description` when description exists, or just `Name` when absent. Update `scriptGenerations.generate` to select `{ name, description }` from resolved topics.

**Alternative considered:** Concatenate descriptions into the user prompt field — rejected because it mixes author intent with topic metadata and is harder to maintain.

### 4. Prompt wording for description suggestion

Ask the model for a concise description (1–2 sentences) explaining what kinds of shadowing scripts belong under this topic — themes, vocabulary areas, or scenarios. Cap response length server-side (e.g. reject if over ~500 characters) to keep descriptions manageable in the UI and prompt.

## Risks / Trade-offs

- **[LLM cost/latency on every suggest click]** → Same as existing color suggestion; button is explicit opt-in.
- **[Generic or inaccurate descriptions]** → User can edit before saving; description is guidance not a contract.
- **[Long descriptions bloating generation prompts]** → Server-side max length validation on suggest output; existing descriptions unchanged unless user re-suggests.
- **[Topics without descriptions unchanged]** → Generation falls back to name-only context, preserving current behavior.

## Migration Plan

No database migration required. Deploy API + UI + prompt changes together. Existing topics with empty descriptions behave as today until the user generates one.

## Open Questions

_(none — scope is well bounded by existing patterns)_
