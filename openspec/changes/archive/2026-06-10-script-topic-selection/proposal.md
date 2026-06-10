## Why

Scripts currently have no link to Topics. Users need to categorize scripts by topic for organization and to provide topical context when generating AI scripts. Wiring Topics to Scripts enables better content management and more relevant AI-generated drafts.

## What Changes

- Add a many-to-many relationship between `Script` and `Topic` (join table `_ScriptTopics`)
- Scripts create/update APIs accept an optional list of topic IDs to associate
- Scripts list/detail APIs include associated topics in the response
- Script creation form provides a multi-select topic picker that fetches all topics eagerly on page load with local search/filter
- AI script generation (`scriptGenerations.generate`) accepts optional topic IDs and injects topic names into the generation prompt for better contextual output

## Capabilities

### New Capabilities

- `script-topic-link`: Many-to-many relationship between Script and Topic, including persistence, API wiring, and UI topic picker for script forms

### Modified Capabilities

- `scripts`: Script create/update APIs accept optional `topicIds` and return associated topics
- `script-generation`: Generation API accepts optional `topicIds` and injects topic context into the AI prompt

## Impact

- **Database**: New implicit many-to-many join table `_ScriptTopics` via Prisma
- **APIs**: `scripts.create`, `scripts.update`, `scripts.getById`, `scripts.list` modified to handle topics; `scriptGenerations.generate` modified to accept topics
- **UI**: Script creation/edit form gains a multi-select topic picker component
- **Dependencies**: Relies on existing `topics.list` API for fetching available topics
