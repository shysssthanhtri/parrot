import { access, mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

import { getLocalStorageDir } from "./config";

const SYSTEM_VOICES_DIR = path.join(process.cwd(), "data/system-voices");
const WAV_EXTENSION = ".wav";

const localStorageRoot = () => path.join(process.cwd(), getLocalStorageDir());

const fileExists = async (filePath: string) => {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
};

const contentTypeForKey = (key: string) => {
  if (key.toLowerCase().endsWith(WAV_EXTENSION)) {
    return "audio/wav";
  }

  return "application/octet-stream";
};

export const resolveLocalObjectPath = async (
  key: string
): Promise<string | null> => {
  const storedPath = path.join(localStorageRoot(), key);
  if (await fileExists(storedPath)) {
    return storedPath;
  }

  if (
    !key.startsWith("system-voices/") ||
    !key.toLowerCase().endsWith(WAV_EXTENSION)
  ) {
    return null;
  }

  const slug = path.basename(key, WAV_EXTENSION).toLowerCase();
  const entries = await readdir(SYSTEM_VOICES_DIR);
  const match = entries.find(
    (entry) => entry.toLowerCase() === `${slug}${WAV_EXTENSION}`
  );

  if (!match) {
    return null;
  }

  return path.join(SYSTEM_VOICES_DIR, match);
};

export const readLocalObject = async (key: string) => {
  const filePath = await resolveLocalObjectPath(key);
  if (!filePath) {
    return null;
  }

  return {
    body: await readFile(filePath),
    contentType: contentTypeForKey(key),
  };
};

export const uploadLocalObject = async (
  key: string,
  body: Buffer | Uint8Array
) => {
  const destPath = path.join(localStorageRoot(), key);
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, body);
};

export const getLocalAudioUrl = (key: string) =>
  `/api/storage/${key.split("/").map(encodeURIComponent).join("/")}`;
