## Why

Topics currently store only a name and an optional free-text description, and users often leave the description empty. When generating scripts with topics attached, the LLM receives only topic names (e.g. "Travel") with no semantic context, so generated content may miss the intended subject area. AI-assisted description generation from the topic name will help authors define richer topic context quickly, and passing those descriptions into script generation will produce more accurate drafts.

## What Changes

- Add a tRPC `topics.suggestDescription` mutation that uses the active LLM provider to generate a concise topic description from a non-empty topic name.
- Add a **Suggest with AI** control on the topic form's description field (create and edit pages), mirroring the existing color suggestion UX.
- Update script generation to inject topic descriptions (when present) into the LLM prompt alongside topic names, giving the model richer topical guidance.

## Capabilities

### New Capabilities

_(none — changes extend existing topic and script-generation capabilities)_

### Modified Capabilities

- `script-topics`: Add AI description suggestion API and CMS form button for generating a description from the topic name.
- `script-generation`: Include topic descriptions in the generation prompt when topics are selected and descriptions exist.

## Impact

- **API**: New `topics.suggestDescription` tRPC mutation in the topics router.
- **CMS UI**: Topic form description field gains an AI suggestion button and loading/error states.
- **Script generation**: `buildScriptGenerationPrompt` and `scriptGenerations.generate` pass topic descriptions into the prompt when available.
- **Dependencies**: No new external dependencies; reuses existing LLM provider infrastructure.
