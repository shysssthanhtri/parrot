-- AlterTable
ALTER TABLE "Script" ADD COLUMN "contentLength" INTEGER NOT NULL DEFAULT 0;

UPDATE "Script" SET "contentLength" = char_length("content");

ALTER TABLE "Script" ALTER COLUMN "contentLength" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Speech" ADD COLUMN "contentLength" INTEGER NOT NULL DEFAULT 0;

UPDATE "Speech" AS s
SET "contentLength" = char_length(sc."content")
FROM "Script" AS sc
WHERE s."scriptId" = sc.id;

ALTER TABLE "Speech" ALTER COLUMN "contentLength" DROP DEFAULT;
