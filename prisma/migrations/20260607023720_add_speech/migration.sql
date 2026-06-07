-- CreateTable
CREATE TABLE "Speech" (
    "id" TEXT NOT NULL,
    "voiceId" TEXT NOT NULL,
    "scriptId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en-US',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "topP" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "topK" INTEGER NOT NULL DEFAULT 1000,
    "repetitionPenalty" DOUBLE PRECISION NOT NULL DEFAULT 1.2,
    "normLoudness" BOOLEAN NOT NULL DEFAULT true,
    "r2ObjectKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Speech_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Speech" ADD CONSTRAINT "Speech_voiceId_fkey" FOREIGN KEY ("voiceId") REFERENCES "Voice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speech" ADD CONSTRAINT "Speech_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Speech" ADD CONSTRAINT "Speech_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
