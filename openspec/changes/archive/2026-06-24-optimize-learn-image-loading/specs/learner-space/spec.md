## REMOVED Requirements

### Requirement: Learner speech catalog thumbnail prefetch

**Reason**: Superseded by windowed thumbnail loading. Prefetch alone did not prevent eager `<Image>` mounting when all carousel items render at once.

**Migration**: Replace prefetch-only behavior with windowed loading that mounts thumbnail images only for the focused speech and the next two.

## ADDED Requirements

### Requirement: Learner speech catalog windowed thumbnail loading

The learner speech catalog SHALL load publication thumbnail images only within a sliding window of three speeches: the focused speech at index _n_ and the next two speeches at indices _n + 1_ and _n + 2_. On initial catalog load with the first speech focused, the client SHALL load thumbnails for indices 0, 1, and 2. When the focused index changes, the client SHALL extend loading to cover the new focused speech and the next two speeches. Speeches without a `thumbnailUrl` SHALL be skipped. Speeches outside the load window SHALL NOT initiate thumbnail image requests and SHALL display the existing placeholder cover UI. Thumbnail loading SHALL NOT block rendering of the active card or navigation transitions. Only the initially visible thumbnail (index 0 on first paint) SHALL use high-priority loading.

#### Scenario: Initial load loads first three thumbnails

- **WHEN** an authenticated user loads `/learn` with at least three published speeches and the first speech is focused
- **THEN** the client loads thumbnail images only for speeches at indices 0, 1, and 2 (when those speeches have `thumbnailUrl` values) and does not load thumbnails for speeches at index 3 or beyond

#### Scenario: Window updates on navigation

- **WHEN** an authenticated user navigates from speech _n_ to speech _n + 1_ in a catalog with more than _n + 2_ speeches
- **THEN** the client loads thumbnail images for speeches at indices _n + 1_, _n + 2_, and _n + 3_ as needed (when those speeches have `thumbnailUrl` values) and does not load thumbnails beyond index _n + 3_ unless the focused index advances again

#### Scenario: Window near end of catalog

- **WHEN** an authenticated user focuses a speech where fewer than two speeches remain after the focused index
- **THEN** the client loads thumbnails only for the focused speech and the remaining next speeches that have `thumbnailUrl` values and does not attempt to load beyond the last speech

#### Scenario: No thumbnail URL

- **WHEN** a speech in the load window has no `thumbnailUrl`
- **THEN** the client skips loading for that speech and continues loading other eligible speeches in the window

#### Scenario: Placeholder outside load window

- **WHEN** a speech is rendered in the carousel but its index is outside the current load window and its thumbnail has not been loaded in the session
- **THEN** the card displays the placeholder cover UI and does not initiate a thumbnail image request

#### Scenario: Priority on first visible thumbnail only

- **WHEN** an authenticated user loads `/learn` with at least one published speech that has a `thumbnailUrl`
- **THEN** only the thumbnail for the first focused speech (index 0) is requested with high priority; other thumbnails in the initial window load without high priority
