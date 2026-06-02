import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env, getR2Endpoint } from "./env";

const PRESIGN_EXPIRES_IN_SECONDS = 3600;

const r2Client = new S3Client({
  region: "auto",
  endpoint: getR2Endpoint(),
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

const toR2Error = (error: unknown) => {
  const response = (
    error as { $response?: { headers?: Record<string, string> } }
  ).$response;
  const server = response?.headers?.server ?? response?.headers?.Server;

  if (server?.includes("Zscaler")) {
    return new Error(
      "R2 upload was blocked by a network proxy (Zscaler). Allow traffic to *.r2.cloudflarestorage.com, or run the seed off VPN/corporate network."
    );
  }

  if (
    error instanceof Error &&
    error.message.includes("Deserialization error")
  ) {
    return new Error(
      "R2 returned a non-S3 response (often HTTP 403 from a firewall). Check R2 credentials, bucket name, and that *.r2.cloudflarestorage.com is reachable from this network.",
      { cause: error }
    );
  }

  return error;
};

export const uploadObject = async (
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
) => {
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  } catch (error) {
    throw toR2Error(error);
  }
};

export const getPresignedGetUrl = async (
  key: string,
  expiresIn = PRESIGN_EXPIRES_IN_SECONDS
) =>
  getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn }
  );
