import { getStorageDriver } from "./config";
import {
  getLocalAudioUrl,
  localObjectExists,
  uploadLocalObject,
} from "./local";
import {
  getR2PresignedGetUrl,
  getR2PresignedPutUrl,
  r2ObjectExists,
  uploadR2Object,
} from "./r2";
import { SPEECH_AUDIO_CONTENT_TYPE } from "./speech-keys";

export { getStorageDriver } from "./config";
export { readLocalObject } from "./local";
export {
  isSpeechObjectKey,
  SPEECH_AUDIO_CONTENT_TYPE,
  speechObjectKeyForId,
  speechObjectKeyMatchesId,
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
