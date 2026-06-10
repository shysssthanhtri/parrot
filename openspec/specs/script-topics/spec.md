# script-topics Specification

## Purpose

Provides a standalone Topic entity for categorizing and grouping scripts. Topics have a name, optional description, and color. They are managed via CMS CRUD pages and can optionally use AI to suggest a contextual color.

## Requirements

### Requirement: Topic persistence model

The system SHALL persist topics in PostgreSQL using a Prisma `Topic` model with fields: `id` (cuid, primary key), `name` (string, non-empty), optional `description` (string), `color` (string, hex format, default `#6b7280`), `userId` (string, required, foreign key to User), `createdAt` (datetime), and `updatedAt` (datetime). Duplicate topic names within a user are allowed.

#### Scenario: Valid topic row

- **WHEN** a topic row exists with `name`, `color`, and `userId` set
- **THEN** the topic is valid and listable

### Requirement: Topics list API

The system SHALL expose a tRPC `topics.list` query available to authenticated CMS users that returns all topics owned by the current user, ordered by `name` ascending.

#### Scenario: List user topics

- **WHEN** an authenticated CMS user calls `topics.list`
- **THEN** all topics owned by that user are returned ordered by `name` ascending

#### Scenario: No topics exist

- **WHEN** an authenticated CMS user with no topics calls `topics.list`
- **THEN** an empty array is returned

### Requirement: Topic create API

The system SHALL expose a tRPC `topics.create` mutation available to authenticated CMS users that accepts `name` (non-empty string), optional `description`, and optional `color` (hex string). The mutation SHALL persist the topic with the current user as owner and return the created row.

#### Scenario: Successful create

- **WHEN** an authenticated CMS user calls `topics.create` with a non-empty `name`
- **THEN** a new topic row is created with the user as owner and returned with an `id`

#### Scenario: Create with color

- **WHEN** an authenticated CMS user calls `topics.create` with `name` and a valid hex `color`
- **THEN** the topic is created with the specified color

#### Scenario: Create with default color

- **WHEN** an authenticated CMS user calls `topics.create` with `name` but no `color`
- **THEN** the topic is created with the default color `#6b7280`

### Requirement: Topic update API

The system SHALL expose a tRPC `topics.update` mutation available to authenticated CMS users that accepts `id`, optional `name`, optional `description`, and optional `color`. The mutation SHALL update only provided fields on the topic owned by the current user and return the updated row or report not found.

#### Scenario: Successful update

- **WHEN** an authenticated CMS user calls `topics.update` with a valid `id` and new `name`
- **THEN** the topic row is updated and returned

#### Scenario: Update unknown topic

- **WHEN** `topics.update` is called with a non-existent `id` or an `id` not owned by the user
- **THEN** the procedure returns a not-found error

#### Scenario: Partial update

- **WHEN** `topics.update` is called with only `color` provided
- **THEN** only the `color` field is updated; `name` and `description` remain unchanged

### Requirement: Topic delete API

The system SHALL expose a tRPC `topics.delete` mutation available to authenticated CMS users that accepts `id` and deletes the topic owned by the current user. The mutation SHALL return success or report not found.

#### Scenario: Successful delete

- **WHEN** an authenticated CMS user calls `topics.delete` with a valid `id` they own
- **THEN** the topic row is deleted

#### Scenario: Delete unknown topic

- **WHEN** `topics.delete` is called with a non-existent `id` or an `id` not owned by the user
- **THEN** the procedure returns a not-found error

### Requirement: Topic input validation

`topics.create` and `topics.update` SHALL reject empty `name` (when provided) and invalid `color` format (must match `/^#[0-9a-fA-F]{6}$/`) with a validation error.

#### Scenario: Empty name rejected on create

- **WHEN** `topics.create` is called with a blank `name`
- **THEN** the procedure returns a validation error and no row is created

#### Scenario: Invalid color rejected

- **WHEN** `topics.create` or `topics.update` is called with a `color` value not matching hex format
- **THEN** the procedure returns a validation error

### Requirement: CMS topics list page

The CMS SHALL provide a page at `/cms/topics` that displays all topics owned by the current user in a table showing name (with color badge), description snippet, and updated date. The page SHALL be accessible only to authenticated CMS users. Clicking a topic row SHALL navigate to `/cms/topics/[topicId]`.

#### Scenario: View topics list

- **WHEN** an authenticated CMS user navigates to `/cms/topics`
- **THEN** a table of their topics is shown with color badges

#### Scenario: Empty state

- **WHEN** an authenticated CMS user with no topics navigates to `/cms/topics`
- **THEN** an empty state message is shown with a prompt to create a topic

#### Scenario: Row click navigates to detail

- **WHEN** a user clicks a topic row in the list table
- **THEN** the app navigates to `/cms/topics/[topicId]`

### Requirement: CMS topic new page

The CMS SHALL provide a page at `/cms/topics/new` with a form to create a new topic. The form SHALL include fields: name (required), description (optional), and color (selectable from a preset palette). The color input SHALL include a button to request an AI-suggested color based on the current topic name. On successful creation, the page SHALL navigate to the new topic's detail page.

#### Scenario: Create via new page

- **WHEN** a user navigates to `/cms/topics/new`, fills in the topic name, and submits
- **THEN** the topic is created and the user is navigated to `/cms/topics/[topicId]`

#### Scenario: Navigate to new page

- **WHEN** a user clicks the create button on the topics list page
- **THEN** the app navigates to `/cms/topics/new`

### Requirement: AI color suggestion

The system SHALL expose a tRPC `topics.suggestColor` mutation available to authenticated CMS users that accepts a `name` (non-empty string) and returns a hex color string suggested by Gemini based on the topic name's semantic meaning.

#### Scenario: Successful color suggestion

- **WHEN** an authenticated CMS user calls `topics.suggestColor` with a non-empty `name`
- **THEN** the system returns a valid hex color string contextually appropriate for the name

#### Scenario: Empty name rejected

- **WHEN** `topics.suggestColor` is called with a blank `name`
- **THEN** the procedure returns a validation error

#### Scenario: AI service failure

- **WHEN** the Gemini API is unavailable or returns unusable output
- **THEN** the procedure returns an error with a user-safe message

#### Scenario: Suggest color button in form

- **WHEN** a user has entered a topic name and clicks the suggest color button
- **THEN** the system calls `topics.suggestColor` and updates the color selection with the result

### Requirement: CMS topic detail page

The CMS SHALL provide a page at `/cms/topics/[topicId]` showing the topic's name, description, and color. The page SHALL allow editing the topic's fields inline or via a form and provide a delete action.

#### Scenario: View topic detail

- **WHEN** an authenticated CMS user navigates to `/cms/topics/[topicId]` for an existing topic
- **THEN** the topic's name, description, and color are displayed

#### Scenario: Edit topic from detail

- **WHEN** a user edits a topic's name on the detail page and saves
- **THEN** the updated name is persisted and reflected on the page

#### Scenario: Unknown topic id

- **WHEN** a user navigates to `/cms/topics/[topicId]` with a non-existent id
- **THEN** a not-found state is shown

### Requirement: CMS topic delete

The CMS SHALL allow deleting a topic from the detail page with a confirmation step. On successful deletion, the user SHALL be navigated back to `/cms/topics`.

#### Scenario: Delete with confirmation

- **WHEN** a user clicks delete on the topic detail page and confirms
- **THEN** the topic is deleted and the user is navigated to `/cms/topics`

#### Scenario: Delete cancelled

- **WHEN** a user clicks delete on a topic and cancels the confirmation
- **THEN** the topic remains unchanged

### Requirement: CMS sidebar topics link

The CMS sidebar navigation SHALL include a "Topics" link that navigates to `/cms/topics`, placed after "Scripts" in the navigation order.

#### Scenario: Topics link visible

- **WHEN** an authenticated CMS user views the sidebar
- **THEN** a "Topics" navigation item is visible and links to `/cms/topics`
