import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { readdir, readFile } from "fs/promises";
import path from "path";
import { z } from "zod";

import { PrismaClient } from "../src/generated/prisma/client";
import { uploadObject } from "../src/lib/r2-client";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ENDPOINT: z.string().url().optional(),
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

const seedSystemVoices = async () => {
  const entries = await readdir(SYSTEM_VOICES_DIR);
  const wavFiles = entries.filter((name) =>
    name.toLowerCase().endsWith(WAV_EXTENSION)
  );

  if (wavFiles.length === 0) {
    console.warn(`No WAV files found in ${SYSTEM_VOICES_DIR}`);
    return;
  }

  for (const filename of wavFiles.sort()) {
    const name = voiceNameFromFilename(filename);
    const r2ObjectKey = r2ObjectKeyFromFilename(filename);
    const filePath = path.join(SYSTEM_VOICES_DIR, filename);
    const body = await readFile(filePath);

    await uploadObject(r2ObjectKey, body, "audio/wav");

    const existing = await prisma.voice.findFirst({
      where: { name, userId: null },
    });

    if (existing) {
      await prisma.voice.update({
        where: { id: existing.id },
        data: { r2ObjectKey },
      });
    } else {
      await prisma.voice.create({
        data: {
          name,
          r2ObjectKey,
          language: "en-US",
          userId: null,
        },
      });
    }

    console.log(`Seeded voice: ${name} → ${r2ObjectKey}`);
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
