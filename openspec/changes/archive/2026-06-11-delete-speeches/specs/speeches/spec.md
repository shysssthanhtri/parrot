## ADDED Requirements

### Requirement: Speech delete API

The system SHALL expose a tRPC `speeches.delete` mutation that accepts a speech `id`. It SHALL succeed only when the speech exists. It SHALL delete the `Speech` row (which cascades removal of all related `SpeechChunk` rows via the existing `onDelete: Cascade` foreign key), and SHALL delete all associated storage objects via the configured storage driver (R2 or local): the final WAV at `r2ObjectKey` and every temp chunk WAV referenced by deleted `SpeechChunk.tempR2Key` values. Deletion SHALL be allowed for any `processStatus` (`pending`, `processing`, `finished`, or `failed`). Linked `Voice` and `Script` rows SHALL NOT be deleted. The procedure SHALL return `{ success: true }` on completion.

#### Scenario: Delete finished speech with audio

- **WHEN** an authenticated CMS client calls `speeches.delete` for a speech with `processStatus` `finished` and a final WAV at `r2ObjectKey`
- **THEN** the speech row and all `SpeechChunk` rows are removed, the final WAV and any temp chunk objects are deleted from storage, and `{ success: true }` is returned

#### Scenario: Delete speech with temp chunks only

- **WHEN** an authenticated CMS client calls `speeches.delete` for a speech with `processStatus` `processing` and temp chunk objects but no final WAV yet
- **THEN** the speech row and chunk rows are removed and all temp chunk objects are deleted from storage

#### Scenario: Delete unknown speech id

- **WHEN** `speeches.delete` is called with a non-existent id
- **THEN** the procedure returns a not-found error and no storage objects are deleted

#### Scenario: Voice and script are preserved

- **WHEN** `speeches.delete` succeeds for a speech linked to a voice and script
- **THEN** the linked voice and script rows remain in the database
