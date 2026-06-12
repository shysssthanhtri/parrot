import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";
import { uploadObject } from "../src/lib/storage";
import { getStorageDriver } from "../src/lib/storage/config";

const storageDriver = getStorageDriver();

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    R2_ACCOUNT_ID: z.string().min(1).optional(),
    R2_ACCESS_KEY_ID: z.string().min(1).optional(),
    R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    R2_BUCKET_NAME: z.string().min(1).optional(),
    R2_ENDPOINT: z.string().url().optional(),
  })
  .superRefine((value, ctx) => {
    if (storageDriver !== "r2") {
      return;
    }

    for (const key of [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ] as const) {
      if (!value[key]) {
        ctx.addIssue({
          code: "custom",
          message: `${key} is required when STORAGE_DRIVER=r2`,
          path: [key],
        });
      }
    }
  });

envSchema.parse(process.env);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SYSTEM_VOICES_DIR = path.join(process.cwd(), "data/system-voices");
const WAV_EXTENSION = ".wav";

const voiceNameFromFilename = (filename: string) =>
  path.basename(filename, WAV_EXTENSION);

const r2ObjectKeyFromFilename = (filename: string) =>
  `system-voices/${voiceNameFromFilename(filename).toLowerCase()}${WAV_EXTENSION}`;

const findExistingSystemVoice = async (name: string, r2ObjectKey: string) => {
  const matches = await prisma.voice.findMany({
    where: {
      userId: null,
      OR: [{ name }, { r2ObjectKey }],
    },
    orderBy: { createdAt: "asc" },
  });

  if (matches.length > 1) {
    console.warn(
      `Found ${matches.length} system voice rows for "${name}" (${r2ObjectKey}); updating the oldest row`
    );
  }

  return matches[0] ?? null;
};

const upsertSystemVoice = async (name: string, r2ObjectKey: string) => {
  const existing = await findExistingSystemVoice(name, r2ObjectKey);

  if (existing) {
    await prisma.voice.update({
      where: { id: existing.id },
      data: { name, r2ObjectKey },
    });
    return;
  }

  await prisma.voice.create({
    data: {
      name,
      r2ObjectKey,
      language: "en-US",
      userId: null,
    },
  });
};

const seedSystemVoices = async () => {
  const entries = await readdir(SYSTEM_VOICES_DIR);
  const wavFiles = entries.filter((name) =>
    name.toLowerCase().endsWith(WAV_EXTENSION)
  );

  if (wavFiles.length === 0) {
    console.warn(`No WAV files found in ${SYSTEM_VOICES_DIR}`);
    return;
  }

  console.log(`Storage driver: ${storageDriver}`);

  for (const filename of wavFiles.sort()) {
    const name = voiceNameFromFilename(filename);
    const r2ObjectKey = r2ObjectKeyFromFilename(filename);
    const filePath = path.join(SYSTEM_VOICES_DIR, filename);

    if (storageDriver === "r2") {
      const body = await readFile(filePath);
      await uploadObject(r2ObjectKey, body, "audio/wav");
    }

    await upsertSystemVoice(name, r2ObjectKey);

    const uploadNote = storageDriver === "local" ? " (local — no upload)" : "";
    console.log(`Seeded voice: ${name} → ${r2ObjectKey}${uploadNote}`);
  }

  console.log(`Done. Seeded ${wavFiles.length} system voices.`);
};

seedSystemVoices()
  .catch((error) => {
    console.error("Failed to seed system voices:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
