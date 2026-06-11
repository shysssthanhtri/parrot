## ADDED Requirements

### Requirement: Script delete API

The system SHALL expose a tRPC `scripts.delete` mutation that accepts a script `id`. It SHALL succeed only when the script exists. Before deleting the script row, it SHALL delete all speeches linked to that script: for each speech, collect storage keys (`r2ObjectKey` and all `SpeechChunk.tempR2Key` values), call `deleteObjects`, then delete the speech row (cascading `SpeechChunk` rows via the existing `onDelete: Cascade` foreign key). After all speeches are removed, it SHALL delete the script row, which disconnects topic associations and sets any linked `ScriptGeneration.scriptId` to null via the existing `onDelete: SetNull` foreign key. Linked `Topic` and `Voice` rows SHALL NOT be deleted. The procedure SHALL return `{ success: true }` on completion.

#### Scenario: Delete script with no speeches

- **WHEN** an authenticated CMS client calls `scripts.delete` for a script with zero linked speeches
- **THEN** the script row is removed, topic associations are cleared, and `{ success: true }` is returned

#### Scenario: Delete script with speeches cascades audio cleanup

- **WHEN** an authenticated CMS client calls `scripts.delete` for a script with one or more linked speeches (any `processStatus`)
- **THEN** all linked speech rows and their `SpeechChunk` rows are removed, all associated storage objects (final WAVs and temp chunk WAVs) are deleted, the script row is removed, and `{ success: true }` is returned

#### Scenario: Delete unknown script id

- **WHEN** `scripts.delete` is called with a non-existent id
- **THEN** the procedure returns a not-found error and no speeches or storage objects are deleted

#### Scenario: Topics and voices are preserved

- **WHEN** `scripts.delete` succeeds for a script linked to topics and speeches that reference voices
- **THEN** topic rows and voice rows remain in the database

## MODIFIED Requirements

### Requirement: Script detail API

The system SHALL expose a tRPC `scripts.getById` query that returns a single script by `id` including its associated topics and a speech count (`_count.speeches`), or reports not found.

#### Scenario: Get script with topics and speech count

- **WHEN** `scripts.getById` is called with a valid `id`
- **THEN** the script is returned with its associated topics included and `_count.speeches` reflecting the number of linked speeches

#### Scenario: Unknown script id

- **WHEN** `scripts.getById` is called with a non-existent id
- **THEN** the procedure returns a not-found error
