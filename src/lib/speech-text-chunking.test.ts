import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { splitTextForTts } from "./speech-text-chunking.ts";

describe("splitTextForTts", () => {
  it("returns a single chunk for short text", () => {
    const text = "Hello world.";
    assert.deepEqual(splitTextForTts(text), [text]);
  });

  it("keeps lowercase ellipsis continuations in one chunk", () => {
    const text = "But sometimes, she felt a little... contained, maybe?";
    assert.deepEqual(splitTextForTts(text), [text]);
  });

  it("prefers paragraph breaks over sentence breaks", () => {
    const paragraphOne = "First paragraph sentence.";
    const paragraphTwo = "Second paragraph sentence.";
    const text = `${paragraphOne}\n\n${paragraphTwo}`;

    assert.deepEqual(splitTextForTts(text, 35), [paragraphOne, paragraphTwo]);
  });

  it("prefers line breaks over sentence breaks", () => {
    const lineOne = "First line here.";
    const lineTwo = "Second line here.";
    const text = `${lineOne}\n${lineTwo}`;

    assert.deepEqual(splitTextForTts(text, 20), [lineOne, lineTwo]);
  });

  it("splits at exclamation and question marks", () => {
    const first = "Stop right there!";
    const second = "What are you doing?";
    const text = `${first} ${second}`;

    assert.deepEqual(splitTextForTts(text, 20), [first, second]);
  });

  it("hard-splits when no boundary fits within the limit", () => {
    const text = "supercalifragilisticexpialidocious";
    assert.deepEqual(splitTextForTts(text, 10), [
      "supercalif",
      "ragilistic",
      "expialidoc",
      "ious",
    ]);
  });

  it("breaks after ellipsis when the next word is uppercase", () => {
    const first = "She paused...";
    const second = "Then she left.";
    const text = `${first} ${second}`;

    assert.deepEqual(splitTextForTts(text, 18), [first, second]);
  });

  it("does not break at lowercase ellipsis even when forced to split", () => {
    const text = "1234567890 a little... contained, maybe?";

    const chunks = splitTextForTts(text, 25);
    assert.equal(chunks[0], "1234567890 a little... co");
    assert.notEqual(chunks[0], "1234567890 a little...");
  });
});
