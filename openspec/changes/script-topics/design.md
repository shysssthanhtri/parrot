## Context

The app manages scripts (text content for TTS) and speeches. As the script library grows, users need a way to categorize and organize scripts. Currently scripts are flat—listed by recency with no grouping. Introducing "topics" provides a lightweight taxonomy that can later be associated with scripts for filtering and used as context in AI script generation.

The project uses: Next.js App Router, tRPC for API layer, Prisma + PostgreSQL for persistence, shadcn/ui components, and a CMS area at `/cms/*` protected by `isCmsUser` auth.

## Goals / Non-Goals

**Goals:**

- Introduce a standalone Topic entity with CRUD lifecycle
- Provide a CMS management page for topics
- Keep the data model simple and extensible for future many-to-many with scripts/speeches

**Non-Goals:**

- Associating topics with scripts or speeches (follow-up change)
- Using topics in script generation prompts (follow-up change)
- Hierarchical/nested topics or parent-child relationships
- Public-facing topic pages

## Decisions

### 1. Flat topic model (no hierarchy)

Topics are a single-level list with `name`, optional `description`, and `color`.

**Rationale**: Simplicity—covers the 80% use case. Hierarchy can be added later via an optional `parentId` self-relation without breaking changes.

**Alternative considered**: Tag-style (many-to-many join only, no standalone entity) — rejected because we want topics to have metadata (description, color) and be managed independently before linking.

### 2. CMS pages at `/cms/topics`

Three pages following the same pattern as `/cms/scripts`: list (`/cms/topics`), new (`/cms/topics/new`), and detail/edit (`/cms/topics/[topicId]`).

**Rationale**: Consistent CMS UX matching the scripts pattern. Users already know the navigation flow.

### 3. Color field as hex string

Topic `color` stored as a hex string (e.g., `#3b82f6`) with a small preset palette in the UI. No custom color picker in v1.

**Rationale**: Simple storage, easy to render as badges. Preset palette ensures visual consistency.

### 4. AI color suggestion via Gemini

A button next to the color input calls Gemini to suggest a contextually appropriate color based on the topic name (e.g., "Nature" → green, "Technology" → blue). Returns a single hex color.

**Rationale**: Low-effort AI integration that adds delight. Reuses existing Gemini infrastructure from script generation.

## Risks / Trade-offs

- **Low usage risk** → Topics are optional; no existing workflow breaks if unused.
- **Color accessibility** → Preset palette should include accessible contrast ratios. Mitigation: Choose WCAG-compliant color set.
