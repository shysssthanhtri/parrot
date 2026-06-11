# script-topics Specification

## MODIFIED Requirements

### Requirement: CMS topics list page

The CMS SHALL provide a page at `/cms/topics` that displays all topics owned by the current user in a table showing name (with color badge), description snippet, and updated date. The page SHALL use the shared CMS page header with **Topics** as the current breadcrumb segment instead of an in-page `h1` title. The page SHALL provide a **New topic** control below the header. The page SHALL be accessible only to authenticated CMS users. Clicking a topic row SHALL navigate to `/cms/topics/[topicId]`.

#### Scenario: View topics list

- **WHEN** an authenticated CMS user navigates to `/cms/topics`
- **THEN** a table of their topics is shown below the page header breadcrumb **Topics**

#### Scenario: Empty state

- **WHEN** an authenticated CMS user with no topics navigates to `/cms/topics`
- **THEN** an empty state message is shown with a prompt to create a topic

#### Scenario: Row click navigates to detail

- **WHEN** a user clicks a topic row in the list table
- **THEN** the app navigates to `/cms/topics/[topicId]`

### Requirement: CMS topic new page

The CMS SHALL provide a page at `/cms/topics/new` with a form to create a new topic. The page SHALL use the shared CMS page header with breadcrumbs **Topics** (link to `/cms/topics`) and **New** as the current segment instead of an in-page back link. The form SHALL include fields: name (required), description (optional), and color (selectable from a preset palette). The color input SHALL include a button to request an AI-suggested color based on the current topic name. On successful creation, the page SHALL navigate to the new topic's detail page.

#### Scenario: Create via new page

- **WHEN** a user navigates to `/cms/topics/new`, fills in the topic name, and submits
- **THEN** the topic is created and the user is navigated to `/cms/topics/[topicId]`

#### Scenario: Navigate to new page

- **WHEN** a user clicks the create button on the topics list page
- **THEN** the app navigates to `/cms/topics/new`

### Requirement: CMS topic detail page

The CMS SHALL provide a page at `/cms/topics/[topicId]` showing the topic's name, description, and color. The page SHALL use the shared CMS page header with breadcrumbs **Topics** (link to `/cms/topics`) and the topic name as the current segment instead of an in-page back link. The page SHALL allow editing the topic's fields inline or via a form and provide a delete action.

#### Scenario: View topic detail

- **WHEN** an authenticated CMS user navigates to `/cms/topics/[topicId]` for an existing topic
- **THEN** the topic's name, description, and color are displayed below the page header breadcrumbs **Topics** → topic name

#### Scenario: Edit topic from detail

- **WHEN** a user edits a topic's name on the detail page and saves
- **THEN** the updated name is persisted and reflected on the page

#### Scenario: Unknown topic id

- **WHEN** a user navigates to `/cms/topics/[topicId]` with a non-existent id
- **THEN** a not-found state is shown

## ADDED Requirements

### Requirement: Loading UI on topics list page

While the topics list page is loading (server data fetch in progress), the CMS SHALL display a loading UI at `/cms/topics` that matches the list page layout: shared page header with **Topics** breadcrumb and a table skeleton with columns for name, description, and updated date.

#### Scenario: Loading state during navigation

- **WHEN** an authenticated CMS user navigates to `/cms/topics` and the page content is not yet ready
- **THEN** a skeleton loading UI is shown with the shared page header breadcrumb **Topics** and a table-shaped placeholder matching the topics list columns
