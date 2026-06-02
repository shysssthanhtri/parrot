import "server-only";

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
});

export const uploadObject = async (
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
) => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
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
