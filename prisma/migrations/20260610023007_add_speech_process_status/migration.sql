-- AlterTable
ALTER TABLE "Speech" ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "processStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "settledChunks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalChunks" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "SpeechChunk" (
    "speechId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tempR2Key" TEXT NOT NULL,
    "durationMs" INTEGER,

    CONSTRAINT "SpeechChunk_pkey" PRIMARY KEY ("speechId","chunkIndex")
);

-- CreateIndex
CREATE INDEX "SpeechChunk_speechId_idx" ON "SpeechChunk"("speechId");

-- AddForeignKey
ALTER TABLE "SpeechChunk" ADD CONSTRAINT "SpeechChunk_speechId_fkey" FOREIGN KEY ("speechId") REFERENCES "Speech"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill legacy speeches created before async TTS processing
UPDATE "Speech" SET "processStatus" = 'finished';
