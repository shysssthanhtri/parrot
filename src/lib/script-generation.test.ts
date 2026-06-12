import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildScriptGenerationPrompt } from "./script-generation-prompt.ts";

describe("buildScriptGenerationPrompt", () => {
  it("includes topic name and description when description exists", () => {
    const prompt = buildScriptGenerationPrompt({
      prompt: "Write about a trip",
      length: "short",
      language: "en-US",
      topics: [
        {
          name: "Travel",
          description:
            "Stories about airports, hotels, and cultural experiences abroad",
        },
      ],
    });

    assert.match(
      prompt,
      /Travel: Stories about airports, hotels, and cultural experiences abroad/
    );
  });

  it("includes topic name only when description is missing", () => {
    const prompt = buildScriptGenerationPrompt({
      prompt: "Write about food",
      length: "medium",
      language: "en-US",
      topics: [{ name: "Food", description: null }],
    });

    assert.match(prompt, /- Food\n/);
    assert.doesNotMatch(prompt, /Food:/);
  });

  it("omits related topics section when no topics are provided", () => {
    const prompt = buildScriptGenerationPrompt({
      prompt: "Write a greeting",
      length: "long",
      language: "en-US",
    });

    assert.doesNotMatch(prompt, /Related topics:/);
  });
});
