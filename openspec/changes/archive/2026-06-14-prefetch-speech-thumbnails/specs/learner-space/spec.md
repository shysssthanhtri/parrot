## ADDED Requirements

### Requirement: Learner speech catalog thumbnail prefetch

While the learner browses the speech catalog, the client SHALL prefetch thumbnail images for the next two speeches after the currently focused speech (indices _n + 1_ and _n + 2_) so those images are likely cached before the user navigates to them. Prefetch SHALL begin after the catalog speech list is available and SHALL update whenever the focused speech index changes. Speeches without a `thumbnailUrl` SHALL be skipped. Prefetch SHALL NOT block rendering of the active card or navigation transitions.

#### Scenario: Prefetch on initial catalog load

- **WHEN** an authenticated user loads `/learn` with at least three published speeches and the first speech is focused
- **THEN** the client initiates prefetch of thumbnail images for speeches 2 and 3 (when those speeches have `thumbnailUrl` values)

#### Scenario: Prefetch updates on navigation

- **WHEN** an authenticated user navigates from speech _n_ to speech _n + 1_ in a catalog with more than _n + 2_ speeches
- **THEN** the client initiates prefetch of thumbnail images for speeches _n + 2_ and _n + 3_ (when those speeches have `thumbnailUrl` values)

#### Scenario: Prefetch near end of catalog

- **WHEN** an authenticated user focuses a speech where fewer than two speeches remain after the focused index
- **THEN** the client prefetches only the remaining next speeches that have `thumbnailUrl` values and does not attempt to prefetch beyond the last speech

#### Scenario: No thumbnail URL

- **WHEN** a speech in the prefetch window has no `thumbnailUrl`
- **THEN** the client skips prefetch for that speech and continues prefetching other eligible speeches in the window
