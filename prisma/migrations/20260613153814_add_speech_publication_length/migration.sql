-- AlterTable
ALTER TABLE "Script" ALTER COLUMN "length" SET DEFAULT 'medium';

-- AlterTable
ALTER TABLE "SpeechPublication" ADD COLUMN     "length" TEXT NOT NULL DEFAULT 'medium';
