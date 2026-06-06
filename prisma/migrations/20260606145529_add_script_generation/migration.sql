-- CreateTable
CREATE TABLE "ScriptGeneration" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "generatedTitle" TEXT,
    "generatedContent" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "model" TEXT NOT NULL,
    "userId" TEXT,
    "scriptId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScriptGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScriptGeneration_scriptId_key" ON "ScriptGeneration"("scriptId");

-- AddForeignKey
ALTER TABLE "ScriptGeneration" ADD CONSTRAINT "ScriptGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScriptGeneration" ADD CONSTRAINT "ScriptGeneration_scriptId_fkey" FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE SET NULL ON UPDATE CASCADE;
