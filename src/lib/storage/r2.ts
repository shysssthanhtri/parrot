import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getR2Endpoint, requireR2Config } from "./config";

const PRESIGN_EXPIRES_IN_SECONDS = 3600;

let r2Client: S3Client | undefined;

const getR2Client = () => {
  if (!r2Client) {
    const config = requireR2Config();
    r2Client = new S3Client({
      region: "auto",
      endpoint: getR2Endpoint(config),
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID,
        secretAccessKey: config.R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });
  }

  return r2Client;
};

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

export const uploadR2Object = async (
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
) => {
  const config = requireR2Config();

  try {
    await getR2Client().send(
      new PutObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  } catch (error) {
    throw toR2Error(error);
  }
};

export const getR2PresignedGetUrl = async (
  key: string,
  expiresIn = PRESIGN_EXPIRES_IN_SECONDS
) => {
  const config = requireR2Config();

  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn }
  );
};

export const getR2PresignedPutUrl = async (
  key: string,
  contentType: string,
  expiresIn = PRESIGN_EXPIRES_IN_SECONDS
) => {
  const config = requireR2Config();

  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  );
};

export const r2ObjectExists = async (key: string) => {
  const config = requireR2Config();

  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: config.R2_BUCKET_NAME,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    const statusCode = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode;

    if (
      (error as { name?: string }).name === "NotFound" ||
      statusCode === 404
    ) {
      return false;
    }

    throw toR2Error(error);
  }
};
