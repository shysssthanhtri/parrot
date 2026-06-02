import { z } from "zod";

export type StorageDriver = "local" | "r2";

export const getStorageDriver = (): StorageDriver => {
  const raw = process.env.STORAGE_DRIVER;
  if (raw === "local" || raw === "r2") {
    return raw;
  }

  return process.env.NODE_ENV === "production" ? "r2" : "local";
};

export const getLocalStorageDir = () =>
  process.env.LOCAL_STORAGE_DIR ?? ".local-storage";

const r2ConfigSchema = z.object({
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url().optional(),
});

export type R2Config = z.infer<typeof r2ConfigSchema>;

export const requireR2Config = (): R2Config =>
  r2ConfigSchema.parse(process.env);

export const getR2Endpoint = (config: R2Config) => {
  const endpoint =
    config.R2_ENDPOINT ??
    `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  return endpoint.replace(/\/$/, "");
};
