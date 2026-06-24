## ADDED Requirements

### Requirement: Learner page loading UI

While the `/learn` page is loading (server data fetch for `speechPublications.list` in progress), the app SHALL display a loading UI in the main content area that matches the speech catalog layout: a single centered portrait card skeleton with a cover-image placeholder, title placeholder, and metadata placeholder, constrained to the same max dimensions as the loaded speech carousel card. The learner layout header (`LearnHeader`) SHALL remain visible during loading. The loading UI SHALL NOT include chevron controls, navigation hints, position indicators, or empty-state copy.

#### Scenario: Loading skeleton during speech list fetch

- **WHEN** an authenticated user navigates to `/learn` and the page server component is still fetching published speeches
- **THEN** a portrait card-shaped skeleton is displayed centered in the main content area beneath the learner header

#### Scenario: Loading UI matches catalog card chrome

- **WHEN** the loading UI is visible on `/learn`
- **THEN** the skeleton uses a card-shaped layout with distinct cover, title, and metadata placeholder regions matching the loaded `SpeechCard` proportions

#### Scenario: Loading UI replaced by catalog

- **WHEN** `speechPublications.list` completes and the page renders
- **THEN** the loading UI is replaced by the speech carousel or empty state without requiring a full-page reload
