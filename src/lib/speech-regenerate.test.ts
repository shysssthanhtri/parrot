import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canRegenerateSpeech,
  REGENERATE_STUCK_THRESHOLD_MS,
} from "./speech-regenerate-eligibility.ts";

describe("canRegenerateSpeech", () => {
  it("allows finished, pending, and failed speeches", () => {
    assert.equal(
      canRegenerateSpeech({
        processStatus: "finished",
        processingStartedAt: null,
      }),
      true
    );
    assert.equal(
      canRegenerateSpeech({
        processStatus: "pending",
        processingStartedAt: null,
      }),
      true
    );
    assert.equal(
      canRegenerateSpeech({
        processStatus: "failed",
        processingStartedAt: null,
      }),
      true
    );
  });

  it("allows processing speeches without a timestamp", () => {
    assert.equal(
      canRegenerateSpeech({
        processStatus: "processing",
        processingStartedAt: null,
      }),
      true
    );
  });

  it("allows processing speeches stuck for at least 30 minutes", () => {
    const startedAt = new Date(
      Date.now() - REGENERATE_STUCK_THRESHOLD_MS - 1_000
    );

    assert.equal(
      canRegenerateSpeech({
        processStatus: "processing",
        processingStartedAt: startedAt,
      }),
      true
    );
  });

  it("rejects recent processing speeches", () => {
    const startedAt = new Date(Date.now() - 5 * 60 * 1000);

    assert.equal(
      canRegenerateSpeech({
        processStatus: "processing",
        processingStartedAt: startedAt,
      }),
      false
    );
  });
});
