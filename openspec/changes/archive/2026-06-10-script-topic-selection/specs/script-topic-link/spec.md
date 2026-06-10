## ADDED Requirements

### Requirement: Script-Topic many-to-many relationship

The system SHALL persist a many-to-many relationship between `Script` and `Topic` using Prisma's implicit relation syntax. A script MAY have zero or more associated topics. A topic MAY be associated with zero or more scripts.

#### Scenario: Script with multiple topics

- **WHEN** a script is associated with topics "Grammar" and "Travel"
- **THEN** querying the script with topics included SHALL return both topic records

#### Scenario: Script with no topics

- **WHEN** a script has no topic associations
- **THEN** querying the script with topics included SHALL return an empty topics array

#### Scenario: Topic associated with multiple scripts

- **WHEN** a topic is associated with three scripts
- **THEN** the topic's scripts relation SHALL include all three script records

### Requirement: Topic deletion removes script associations

The system SHALL automatically remove script-topic associations when a topic is deleted, without deleting the associated scripts.

#### Scenario: Delete topic with linked scripts

- **WHEN** a topic associated with two scripts is deleted
- **THEN** the topic is removed and the two scripts remain with the topic association removed
