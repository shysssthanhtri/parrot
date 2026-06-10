## Context

The app has standalone `Topic` and `Script` models with no relationship between them. Topics are CRUD-managed per user. Scripts can be created manually or via AI generation. The script form currently has fields for title, language, and content. The AI generation prompt uses only the user-provided prompt text with no topical context.

## Goals / Non-Goals

**Goals:**

- Establish a many-to-many relationship between Script and Topic
- Allow users to select multiple topics when creating/editing a script
- Inject selected topic names into the AI generation prompt for context
- Eagerly load all topics on the script form page (no lazy loading on dropdown open)
- Support local filtering/search on the topic list in the UI

**Non-Goals:**

- Pagination or server-side filtering of topics (fetch all, filter client-side)
- Creating new topics inline from the script form (use existing Topics CMS page)
- Changing the Topic model or its CRUD APIs
- Filtering scripts by topic in the scripts list (future work)

## Decisions

### 1. Prisma implicit many-to-many relation

Use Prisma's implicit many-to-many syntax (`topics Topic[]` on Script, `scripts Script[]` on Topic). This auto-creates a `_ScriptToTopic` join table without needing a manual model.

**Rationale:** Simpler schema, no extra model to maintain. The join table has no extra fields (no ordering, no metadata on the link). Prisma handles the connect/disconnect operations cleanly.

**Alternative considered:** Explicit join model `ScriptTopic` — rejected because no extra data is stored on the relationship.

### 2. Topic IDs passed as optional array in create/update

`scripts.create` and `scripts.update` accept an optional `topicIds: string[]` field. The API uses Prisma's `connect` (create) and `set` (update) operations.

**Rationale:** `set` on update replaces the full topic list which matches the UI behavior (user sees all selected, submits the full set). Avoids needing separate add/remove endpoints.

### 3. Eager topic fetch via `topics.list` on page load

The script form page calls `topics.list` at the page level (server component) or via a `useQuery` with no `enabled` condition. Topics are passed to the form component. Client-side filtering with a text input narrows the list.

**Rationale:** Topic counts are expected to be low per user (tens, not thousands). Eager loading avoids waterfall requests when opening the selector. Local search is instant.

### 4. Multi-select topic picker as combobox with badges

Use a combobox/popover pattern with checkboxes for multi-selection and badge chips showing selected topics with their colors. Filter input at the top of the popover.

**Rationale:** Consistent with shadcn/ui patterns already used in the project. Badges with topic colors give visual feedback.

### 5. Topic injection in AI generation prompt

When `topicIds` are provided to `scriptGenerations.generate`, resolve topic names from DB and append them to the prompt context section. Format: `\nRelated topics: topic1, topic2, topic3`

**Rationale:** Lightweight injection that gives the LLM topical direction without overriding the user's explicit prompt. Topic names are descriptive enough without needing descriptions.

## Risks / Trade-offs

- **[Risk] Topics fetched eagerly could be stale if user creates a topic in another tab** → Acceptable for now; user can refresh the page. Low impact given typical workflow.
- **[Risk] Large topic list could make the picker unwieldy** → Mitigated by local search filter. If user has 100+ topics, they can type to narrow.
- **[Trade-off] Using `set` on update replaces all topic connections** → This means the full selected list must always be sent. Simpler than diff-based connect/disconnect but slightly more data on wire (negligible for ID arrays).
