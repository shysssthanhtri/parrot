-- AlterTable
ALTER TABLE "Script" ADD COLUMN "length" TEXT NOT NULL DEFAULT 'medium';

UPDATE "Script" AS s
SET "length" = sg."length"
FROM "ScriptGeneration" AS sg
WHERE sg."scriptId" = s."id";

ALTER TABLE "Script" ALTER COLUMN "length" DROP DEFAULT;
