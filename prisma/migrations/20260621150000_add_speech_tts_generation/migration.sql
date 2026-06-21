-- CreateEnum
CREATE TYPE "SpeechTtsGenerationStatus" AS ENUM ('processing', 'finished', 'failed');

-- CreateTable
CREATE TABLE "SpeechTtsGeneration" (
    "id" TEXT NOT NULL,
    "speechId" TEXT NOT NULL,
    "status" "SpeechTtsGenerationStatus" NOT NULL,
    "errorMessage" TEXT,
    "workflowRunId" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeechTtsGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpeechTtsGeneration_speechId_key" ON "SpeechTtsGeneration"("speechId");

-- AddForeignKey
ALTER TABLE "SpeechTtsGeneration" ADD CONSTRAINT "SpeechTtsGeneration_speechId_fkey" FOREIGN KEY ("speechId") REFERENCES "Speech"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill generation rows from legacy Speech TTS status fields
INSERT INTO "SpeechTtsGeneration" (
    "id",
    "speechId",
    "status",
    "errorMessage",
    "workflowRunId",
    "processingStartedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    "id",
    CASE
        WHEN "processStatus" = 'finished' THEN 'finished'::"SpeechTtsGenerationStatus"
        WHEN "processStatus" = 'failed' THEN 'failed'::"SpeechTtsGenerationStatus"
        ELSE 'processing'::"SpeechTtsGenerationStatus"
    END,
    "errorMessage",
    NULL,
    "processingStartedAt",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Speech";

-- DropForeignKey
ALTER TABLE "SpeechChunk" DROP CONSTRAINT "SpeechChunk_speechId_fkey";

-- DropTable
DROP TABLE "SpeechChunk";

-- AlterTable
ALTER TABLE "Speech" DROP COLUMN "processStatus",
DROP COLUMN "errorMessage",
DROP COLUMN "totalChunks",
DROP COLUMN "settledChunks",
DROP COLUMN "processingStartedAt";
