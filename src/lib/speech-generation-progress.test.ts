import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSpeechGenerationProgress } from "./speech-generation-progress.ts";

describe("getSpeechGenerationProgress", () => {
  it("returns null when speech is finished", () => {
    assert.equal(getSpeechGenerationProgress("finished", 12, 12), null);
  });

  it("returns null when speech failed", () => {
    assert.equal(getSpeechGenerationProgress("failed", 12, 3), null);
  });

  it("returns starting state for pending with zero chunks", () => {
    assert.deepEqual(getSpeechGenerationProgress("pending", 0, 0), {
      phase: "starting",
      percent: 0,
      settledChunks: 0,
      totalChunks: 0,
      label: "Starting generation…",
    });
  });

  it("returns starting state for processing before chunks are known", () => {
    assert.deepEqual(getSpeechGenerationProgress("processing", 0, 0), {
      phase: "starting",
      percent: 0,
      settledChunks: 0,
      totalChunks: 0,
      label: "Starting generation…",
    });
  });

  it("returns synthesizing progress mid-generation", () => {
    assert.deepEqual(getSpeechGenerationProgress("processing", 12, 3), {
      phase: "synthesizing",
      percent: 25,
      settledChunks: 3,
      totalChunks: 12,
      label: "Generating audio — 25% (3 of 12 chunks)",
    });
  });

  it("returns synthesizing progress at zero settled chunks", () => {
    assert.deepEqual(getSpeechGenerationProgress("processing", 12, 0), {
      phase: "synthesizing",
      percent: 0,
      settledChunks: 0,
      totalChunks: 12,
      label: "Generating audio — 0% (0 of 12 chunks)",
    });
  });

  it("returns finalizing state when all chunks are settled", () => {
    assert.deepEqual(getSpeechGenerationProgress("processing", 12, 12), {
      phase: "finalizing",
      percent: 100,
      settledChunks: 12,
      totalChunks: 12,
      label: "Finalizing audio…",
    });
  });
});
