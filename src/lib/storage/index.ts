import { getStorageDriver } from "./config";
import {
  deleteLocalObject,
  getLocalAudioUrl,
  localObjectExists,
  readLocalObject,
  uploadLocalObject,
} from "./local";
import {
  deleteR2Object,
  getR2PresignedGetUrl,
  getR2PresignedPutUrl,
  r2ObjectExists,
  readR2Object,
  uploadR2Object,
} from "./r2";
import { SPEECH_AUDIO_CONTENT_TYPE } from "./speech-keys";

export { getStorageDriver } from "./config";
export { readLocalObject } from "./local";
export {
  isSpeechChunkObjectKey,
  isSpeechObjectKey,
  isSpeechThumbnailObjectKey,
  SPEECH_AUDIO_CONTENT_TYPE,
  SPEECH_THUMBNAIL_CONTENT_TYPE,
  speechChunkObjectKey,
  speechChunkObjectKeyMatches,
  speechObjectKeyForId,
  speechObjectKeyMatchesId,
  speechThumbnailObjectKey,
  speechThumbnailObjectKeyMatchesId,
} from "./speech-keys";

export const uploadObject = async (
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
) => {
  if (getStorageDriver() === "local") {
    return uploadLocalObject(key, body);
  }

  return uploadR2Object(key, body, contentType);
};

export const getAudioUrl = async (key: string) => {
  if (getStorageDriver() === "local") {
    return getLocalAudioUrl(key);
  }

  return getR2PresignedGetUrl(key);
};

/** @deprecated Use `getAudioUrl` instead. */
export const getPresignedGetUrl = getAudioUrl;

export const objectExists = async (key: string) => {
  if (getStorageDriver() === "local") {
    return localObjectExists(key);
  }

  return r2ObjectExists(key);
};

export const readObject = async (key: string) => {
  if (getStorageDriver() === "local") {
    return readLocalObject(key);
  }

  return readR2Object(key);
};

export const deleteObject = async (key: string) => {
  if (getStorageDriver() === "local") {
    return deleteLocalObject(key);
  }

  return deleteR2Object(key);
};

export const deleteObjects = async (keys: string[]) => {
  await Promise.all(keys.map((key) => deleteObject(key)));
};

export const getSpeechUploadUrl = async (key: string) => {
  if (getStorageDriver() === "local") {
    return {
      uploadUrl: `/api/storage/upload?key=${encodeURIComponent(key)}`,
      method: "PUT" as const,
    };
  }

  const uploadUrl = await getR2PresignedPutUrl(key, SPEECH_AUDIO_CONTENT_TYPE);

  return {
    uploadUrl,
    method: "PUT" as const,
  };
};
