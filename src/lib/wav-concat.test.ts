import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CHUNK_JOIN_GAP_MS,
  concatWavBuffers,
  getWavDurationMs,
} from "./wav-concat.ts";

function createTestWav(durationMs: number, sampleRate = 24_000): Buffer {
  const numChannels = 1;
  const bitsPerSample = 16;
  const blockAlign = numChannels * (bitsPerSample / 8);
  const numFrames = Math.round((sampleRate * durationMs) / 1000);
  const pcmData = Buffer.alloc(numFrames * blockAlign, 0x7f);

  const headerSize = 44;
  const output = Buffer.alloc(headerSize + pcmData.length);

  output.write("RIFF", 0);
  output.writeUInt32LE(headerSize - 8 + pcmData.length, 4);
  output.write("WAVE", 8);
  output.write("fmt ", 12);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(numChannels, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * blockAlign, 28);
  output.writeUInt16LE(blockAlign, 32);
  output.writeUInt16LE(bitsPerSample, 34);
  output.write("data", 36);
  output.writeUInt32LE(pcmData.length, 40);
  pcmData.copy(output, headerSize);

  return output;
}

function buildMultiChunkAlignment(
  chunkDurationsMs: number[],
  gapMs: number
): Array<{ startMs: number; endMs: number }> {
  const segments: Array<{ startMs: number; endMs: number }> = [];
  let startMs = 0;

  for (let index = 0; index < chunkDurationsMs.length; index += 1) {
    const durationMs = chunkDurationsMs[index];
    const isLastChunk = index === chunkDurationsMs.length - 1;
    const endMs = startMs + durationMs + (isLastChunk ? 0 : gapMs);
    segments.push({ startMs, endMs });
    startMs = endMs;
  }

  return segments;
}

describe("concatWavBuffers", () => {
  it("adds approximately gapMs duration between two chunks", () => {
    const gapMs = 400;
    const chunkOne = createTestWav(1000);
    const chunkTwo = createTestWav(2000);
    const withoutGap = concatWavBuffers([chunkOne, chunkTwo]);
    const withGap = concatWavBuffers([chunkOne, chunkTwo], gapMs);

    const withoutGapMs = getWavDurationMs(withoutGap);
    const withGapMs = getWavDurationMs(withGap);

    assert.ok(withGapMs > withoutGapMs);
    assert.ok(Math.abs(withGapMs - withoutGapMs - gapMs) <= 1);
  });

  it("ignores gapMs for a single buffer", () => {
    const chunk = createTestWav(1500);
    const withoutGap = concatWavBuffers([chunk]);
    const withGap = concatWavBuffers([chunk], CHUNK_JOIN_GAP_MS);

    assert.equal(withoutGap, chunk);
    assert.equal(withGap, chunk);
    assert.equal(getWavDurationMs(withGap), 1500);
  });

  it("matches multi-chunk alignment timing including inter-chunk gaps", () => {
    const gapMs = CHUNK_JOIN_GAP_MS;
    const chunkDurationsMs = [1000, 2000, 1500];
    const buffers = chunkDurationsMs.map((durationMs) =>
      createTestWav(durationMs)
    );
    const combined = concatWavBuffers(buffers, gapMs);
    const totalDurationMs = getWavDurationMs(combined);
    const alignment = buildMultiChunkAlignment(chunkDurationsMs, gapMs);

    assert.equal(alignment[0].startMs, 0);
    assert.equal(alignment[0].endMs, alignment[1].startMs);
    assert.equal(alignment[1].endMs, alignment[2].startMs);
    assert.equal(
      alignment[alignment.length - 1].endMs,
      chunkDurationsMs.reduce((sum, durationMs) => sum + durationMs, 0) +
        gapMs * (chunkDurationsMs.length - 1)
    );
    assert.ok(
      Math.abs(totalDurationMs - alignment[alignment.length - 1].endMs) <= 1
    );
  });
});
