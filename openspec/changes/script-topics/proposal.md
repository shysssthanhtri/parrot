## Why

Scripts currently have no categorization mechanism, making it difficult to organize, filter, and group them as the library grows. Topics also provide valuable context for AI script generation—enabling prompts scoped to a subject area (e.g., "technology", "health", "storytelling").

## What Changes

- Introduce a **Topic** entity with a name, optional description, and color for visual grouping.
- Provide CRUD APIs for managing topics.
- Provide a CMS UI for creating, editing, listing, and deleting topics.
- Topics are standalone for now; wiring into scripts and speeches will come in a follow-up change.

## Capabilities

### New Capabilities

- `script-topics`: Core topic entity (model, CRUD APIs, and CMS management UI) for categorizing and grouping scripts.

### Modified Capabilities

_(none — topics are introduced as a standalone entity first)_

## Impact

- **Database**: New `Topic` Prisma model and migration.
- **API**: New tRPC `topics` router with list, create, update, and delete procedures.
- **CMS UI**: New topics management page accessible from the sidebar.
- **Dependencies**: No new external dependencies.
