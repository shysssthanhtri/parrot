type WavFormat = {
  audioFormat: number;
  numChannels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
};

type ParsedWav = {
  format: WavFormat;
  pcmData: Buffer;
};

function parseFmtChunk(data: Buffer): WavFormat {
  if (data.length < 16) {
    throw new Error("Invalid WAV: fmt chunk too short");
  }

  return {
    audioFormat: data.readUInt16LE(0),
    numChannels: data.readUInt16LE(2),
    sampleRate: data.readUInt32LE(4),
    byteRate: data.readUInt32LE(8),
    blockAlign: data.readUInt16LE(12),
    bitsPerSample: data.readUInt16LE(14),
  };
}

function parseWav(buffer: Buffer): ParsedWav {
  if (buffer.length < 12) {
    throw new Error("Invalid WAV: buffer too short");
  }

  if (buffer.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("Invalid WAV: missing RIFF header");
  }

  if (buffer.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error("Invalid WAV: missing WAVE format");
  }

  let offset = 12;
  let format: WavFormat | null = null;
  let pcmData: Buffer | null = null;

  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataStart = offset + 8;
    const chunkDataEnd = chunkDataStart + chunkSize;

    if (chunkDataEnd > buffer.length) {
      break;
    }

    if (chunkId === "fmt ") {
      format = parseFmtChunk(buffer.subarray(chunkDataStart, chunkDataEnd));
    } else if (chunkId === "data") {
      pcmData = buffer.subarray(chunkDataStart, chunkDataEnd);
    }

    offset = chunkDataEnd + (chunkSize % 2);
  }

  if (!format) {
    throw new Error("Invalid WAV: missing fmt chunk");
  }

  if (!pcmData) {
    throw new Error("Invalid WAV: missing data chunk");
  }

  return { format, pcmData };
}

function formatsMatch(a: WavFormat, b: WavFormat): boolean {
  return (
    a.audioFormat === b.audioFormat &&
    a.numChannels === b.numChannels &&
    a.sampleRate === b.sampleRate &&
    a.bitsPerSample === b.bitsPerSample
  );
}

function buildWav(format: WavFormat, pcmData: Buffer): Buffer {
  const headerSize = 44;
  const riffChunkSize = headerSize - 8 + pcmData.length;
  const output = Buffer.alloc(headerSize + pcmData.length);

  output.write("RIFF", 0);
  output.writeUInt32LE(riffChunkSize, 4);
  output.write("WAVE", 8);
  output.write("fmt ", 12);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(format.audioFormat, 20);
  output.writeUInt16LE(format.numChannels, 22);
  output.writeUInt32LE(format.sampleRate, 24);
  output.writeUInt32LE(format.byteRate, 28);
  output.writeUInt16LE(format.blockAlign, 32);
  output.writeUInt16LE(format.bitsPerSample, 34);
  output.write("data", 36);
  output.writeUInt32LE(pcmData.length, 40);
  pcmData.copy(output, headerSize);

  return output;
}

/**
 * Return the playback duration of a WAV buffer in integer milliseconds.
 * Derived from PCM frame count and sample rate for sample-accurate timing.
 */
export function getWavDurationMs(buffer: Buffer): number {
  const { format, pcmData } = parseWav(buffer);
  const numFrames = pcmData.length / format.blockAlign;
  return Math.round((numFrames / format.sampleRate) * 1000);
}

/**
 * Concatenate multiple WAV buffers with matching format into one playable file.
 */
export function concatWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) {
    throw new Error("Cannot concatenate an empty WAV buffer list");
  }

  if (buffers.length === 1) {
    return buffers[0];
  }

  const parsed = buffers.map(parseWav);
  const firstFormat = parsed[0].format;

  for (let index = 1; index < parsed.length; index += 1) {
    if (!formatsMatch(firstFormat, parsed[index].format)) {
      const first = firstFormat;
      const other = parsed[index].format;
      throw new Error(
        `Incompatible WAV formats: segment 0 is ${first.sampleRate}Hz ${first.numChannels}ch ${first.bitsPerSample}-bit, segment ${index} is ${other.sampleRate}Hz ${other.numChannels}ch ${other.bitsPerSample}-bit`
      );
    }
  }

  const pcmData = Buffer.concat(parsed.map((segment) => segment.pcmData));
  return buildWav(firstFormat, pcmData);
}
