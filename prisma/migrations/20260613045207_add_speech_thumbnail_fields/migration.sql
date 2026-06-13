-- AlterTable
ALTER TABLE "Speech" ADD COLUMN     "thumbnailErrorMessage" TEXT,
ADD COLUMN     "thumbnailProcessStatus" TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN     "thumbnailR2ObjectKey" TEXT;

-- AlterTable
ALTER TABLE "SpeechPublication" ADD COLUMN     "thumbnailR2ObjectKey" TEXT;
