## ADDED Requirements

### Requirement: Learner page dev server timing

In development, the `/learn` route SHALL emit a structured server-side timing breakdown for each request, covering at minimum layout auth, the `speechPublications.list` data fetch, database query time, and thumbnail resolution time, with the published speech count included in the log output.

#### Scenario: Dev timing visibility on learn page load

- **WHEN** a developer loads `/learn` in development with one or more published speeches
- **THEN** a structured timing log is written showing per-phase durations and publication count for that request
