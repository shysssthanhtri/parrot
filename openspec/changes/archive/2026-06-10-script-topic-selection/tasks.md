## 1. Database Schema

- [x] 1.1 Add implicit many-to-many relation between Script and Topic in `prisma/schema.prisma` (`topics Topic[]` on Script, `scripts Script[]` on Topic)
- [x] 1.2 Run `prisma migrate dev` to create the join table migration

## 2. Scripts API

- [x] 2.1 Update `scripts.create` to accept optional `topicIds` and connect topics on creation
- [x] 2.2 Update `scripts.update` to accept optional `topicIds` and use `set` to replace topic associations
- [x] 2.3 Update `scripts.list` to include associated topics in the response
- [x] 2.4 Update `scripts.getById` to include associated topics in the response

## 3. Script Generation API

- [x] 3.1 Update `scriptGenerations.generate` input schema to accept optional `topicIds`
- [x] 3.2 Resolve topic names from DB when `topicIds` are provided
- [x] 3.3 Modify `buildScriptGenerationPrompt` to accept and inject topic names into the prompt

## 4. UI - Topic Picker Component

- [x] 4.1 Create a multi-select topic picker component with local search/filter and color badges
- [x] 4.2 Integrate topic picker into ScriptForm (create and edit modes)
- [x] 4.3 Fetch topics eagerly on the script page load (server component or top-level useQuery)
- [x] 4.4 Pass selected topic IDs to `scripts.create` and `scripts.update` mutations

## 5. UI - AI Generation Dialog

- [x] 5.1 Pass selected topic IDs from the form to ScriptGenerateDialog
- [x] 5.2 Include `topicIds` in the `scriptGenerations.generate` mutation call
