import { getStorageDriver } from "./config";
import { getLocalAudioUrl, uploadLocalObject } from "./local";
import { getR2PresignedGetUrl, uploadR2Object } from "./r2";

export { getStorageDriver } from "./config";
export { readLocalObject } from "./local";

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
