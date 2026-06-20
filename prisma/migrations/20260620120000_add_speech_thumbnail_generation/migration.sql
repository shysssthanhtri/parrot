-- CreateEnum
CREATE TYPE "SpeechThumbnailGenerationStatus" AS ENUM ('processing', 'finished', 'failed');

-- CreateTable
CREATE TABLE "SpeechThumbnailGeneration" (
    "id" TEXT NOT NULL,
    "speechId" TEXT NOT NULL,
    "status" "SpeechThumbnailGenerationStatus" NOT NULL,
    "errorMessage" TEXT,
    "workflowRunId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeechThumbnailGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpeechThumbnailGeneration_speechId_key" ON "SpeechThumbnailGeneration"("speechId");

-- AddForeignKey
ALTER TABLE "SpeechThumbnailGeneration" ADD CONSTRAINT "SpeechThumbnailGeneration_speechId_fkey" FOREIGN KEY ("speechId") REFERENCES "Speech"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill generation rows from legacy Speech thumbnail status fields
INSERT INTO "SpeechThumbnailGeneration" (
    "id",
    "speechId",
    "status",
    "errorMessage",
    "workflowRunId",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    "id",
    CASE
        WHEN "thumbnailProcessStatus" = 'finished' THEN 'finished'::"SpeechThumbnailGenerationStatus"
        WHEN "thumbnailProcessStatus" = 'failed' THEN 'failed'::"SpeechThumbnailGenerationStatus"
        ELSE 'processing'::"SpeechThumbnailGenerationStatus"
    END,
    "thumbnailErrorMessage",
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Speech";

-- DropColumn
ALTER TABLE "Speech" DROP COLUMN "thumbnailProcessStatus";

-- DropColumn
ALTER TABLE "Speech" DROP COLUMN "thumbnailErrorMessage";
