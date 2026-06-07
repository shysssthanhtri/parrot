## ADDED Requirements

### Requirement: OpenAPI codegen configuration

The system SHALL maintain an OpenAPI codegen config file at `openapi/generate.config.json` listing one or more `{ input, output }` mappings from committed snapshot files to generated TypeScript declaration paths.

Adding a new external API SHALL require only a new snapshot file and a new config entry — no changes to the generate script.

#### Scenario: Config lists multiple APIs

- **WHEN** `openapi/generate.config.json` contains entries for two or more OpenAPI snapshots
- **THEN** each entry maps a distinct `openapi/<name>.openapi.json` input to a distinct `src/lib/<name>/schema.d.ts` output

#### Scenario: Missing snapshot fails fast

- **WHEN** a config entry references an `input` file that does not exist
- **THEN** the generate script exits with a non-zero status and a clear error message

### Requirement: Shared OpenAPI type generation script

The system SHALL provide a single package script `generate:api` that runs `scripts/generate-openapi.mjs` to invoke `openapi-typescript` for every entry in `openapi/generate.config.json` (or a filtered subset).

Generation SHALL read committed snapshot files only — not live service URLs — so it works offline and in CI without external uptime.

#### Scenario: Generate all API types

- **WHEN** a developer runs `pnpm generate:api` with no arguments
- **THEN** all configured `schema.d.ts` outputs are regenerated from their snapshot inputs

#### Scenario: Generate one API type

- **WHEN** a developer runs `pnpm generate:api chatterbox`
- **THEN** only the config entry whose input filename stem matches `chatterbox` is regenerated

#### Scenario: Offline generation

- **WHEN** `pnpm generate:api` runs without network access
- **THEN** generation succeeds using committed snapshots under `openapi/`
