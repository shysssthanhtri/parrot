const SPEECH_OBJECT_KEY_PATTERN =
  /^speeches\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.wav$/i;

const SPEECH_CHUNK_OBJECT_KEY_PATTERN =
  /^speeches\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/chunks\/\d+\.wav$/i;

export const SPEECH_AUDIO_CONTENT_TYPE = "audio/wav";

export const speechObjectKeyForId = (id: string) => `speeches/${id}.wav`;

export const speechChunkObjectKey = (speechId: string, chunkIndex: number) =>
  `speeches/${speechId}/chunks/${chunkIndex}.wav`;

export const isSpeechObjectKey = (key: string) =>
  SPEECH_OBJECT_KEY_PATTERN.test(key);

export const isSpeechChunkObjectKey = (key: string) =>
  SPEECH_CHUNK_OBJECT_KEY_PATTERN.test(key);

export const speechChunkObjectKeyMatches = (
  speechId: string,
  chunkIndex: number,
  key: string
) => key === speechChunkObjectKey(speechId, chunkIndex);

export const speechObjectKeyMatchesId = (id: string, r2ObjectKey: string) =>
  r2ObjectKey === speechObjectKeyForId(id);
