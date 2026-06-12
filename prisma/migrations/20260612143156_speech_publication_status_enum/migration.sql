/*
  Warnings:

  - Changed the type of `status` on the `SpeechPublication` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SpeechPublicationStatus" AS ENUM ('published', 'unpublished');

-- AlterTable
ALTER TABLE "SpeechPublication" DROP COLUMN "status",
ADD COLUMN     "status" "SpeechPublicationStatus" NOT NULL;

-- CreateIndex
CREATE INDEX "SpeechPublication_status_idx" ON "SpeechPublication"("status");
