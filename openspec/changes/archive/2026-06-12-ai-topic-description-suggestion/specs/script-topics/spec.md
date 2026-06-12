## ADDED Requirements

### Requirement: AI description suggestion

The system SHALL expose a tRPC `topics.suggestDescription` mutation available to authenticated CMS users that accepts a `name` (non-empty string) and returns a non-empty `description` string suggested by the active LLM provider. The suggested description SHALL be a concise summary (1–2 sentences) of what kinds of shadowing scripts fit under the given topic name.

#### Scenario: Successful description suggestion

- **WHEN** an authenticated CMS user calls `topics.suggestDescription` with a non-empty `name`
- **THEN** the system returns a non-empty description string contextually appropriate for the name

#### Scenario: Empty name rejected

- **WHEN** `topics.suggestDescription` is called with a blank `name`
- **THEN** the procedure returns a validation error

#### Scenario: AI service failure

- **WHEN** the active LLM provider is unavailable or returns unusable output
- **THEN** the procedure returns an error with a user-safe message

#### Scenario: Suggest description button in form

- **WHEN** a user has entered a topic name and clicks the suggest description button
- **THEN** the system calls `topics.suggestDescription` and updates the description field with the result

## MODIFIED Requirements

### Requirement: CMS topic new page

The CMS SHALL provide a page at `/cms/topics/new` with a form to create a new topic. The page SHALL use the shared CMS page header with breadcrumbs **Topics** (link to `/cms/topics`) and **New** as the current segment instead of an in-page back link. The form SHALL include fields: name (required), description (optional), and color (selectable from a preset palette). The description input SHALL include a button to request an AI-suggested description based on the current topic name. The color input SHALL include a button to request an AI-suggested color based on the current topic name. On successful creation, the page SHALL navigate to the new topic's detail page.

#### Scenario: Create via new page

- **WHEN** a user navigates to `/cms/topics/new`, fills in the topic name, and submits
- **THEN** the topic is created and the user is navigated to `/cms/topics/[topicId]`

#### Scenario: Navigate to new page

- **WHEN** a user clicks the create button on the topics list page
- **THEN** the app navigates to `/cms/topics/new`

### Requirement: CMS topic detail page

The CMS SHALL provide a page at `/cms/topics/[topicId]` showing the topic's name, description, and color. The page SHALL use the shared CMS page header with breadcrumbs **Topics** (link to `/cms/topics`) and the topic name as the current segment instead of an in-page back link. The page SHALL allow editing the topic's fields inline or via a form and provide a delete action. The description field in the edit form SHALL include a button to request an AI-suggested description based on the current topic name.

#### Scenario: View topic detail

- **WHEN** an authenticated CMS user navigates to `/cms/topics/[topicId]` for an existing topic
- **THEN** the topic's name, description, and color are displayed below the page header breadcrumbs **Topics** → topic name

#### Scenario: Edit topic from detail

- **WHEN** a user edits a topic's name on the detail page and saves
- **THEN** the updated name is persisted and reflected on the page

#### Scenario: Unknown topic id

- **WHEN** a user navigates to `/cms/topics/[topicId]` with a non-existent id
- **THEN** a not-found state is shown
