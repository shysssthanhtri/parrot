-- CreateTable
CREATE TABLE "SpeechPublication" (
    "id" TEXT NOT NULL,
    "speechId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "alignment" JSONB NOT NULL,
    "r2ObjectKey" TEXT NOT NULL,
    "voiceName" TEXT NOT NULL,
    "topicIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpeechPublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpeechPublication_speechId_key" ON "SpeechPublication"("speechId");

-- CreateIndex
CREATE INDEX "SpeechPublication_status_idx" ON "SpeechPublication"("status");

-- CreateIndex
CREATE INDEX "SpeechPublication_language_idx" ON "SpeechPublication"("language");

-- CreateIndex
CREATE INDEX "SpeechPublication_topicIds_idx" ON "SpeechPublication" USING GIN ("topicIds");

-- AddForeignKey
ALTER TABLE "SpeechPublication" ADD CONSTRAINT "SpeechPublication_speechId_fkey" FOREIGN KEY ("speechId") REFERENCES "Speech"("id") ON DELETE CASCADE ON UPDATE CASCADE;
